const express = require('express')
const uploader = require('express-fileupload')
// const {extname,resolve} = require('path')
// const {
//   existsSync,
//   mkdirSync,
//   promises:{
//     writeFile,
//     appendFile
//   }
// } = require('fs')
// const router = express.Router()
const app = express()
const router = require('./upload')

/**
 *
 * 公共系统初始化
 *
 */
 app.use(express.json())
 app.use(express.urlencoded({ extended: false }))
 // 上传的中间件
app.use(uploader())

// 加载静态资源
app.use('/',express.static('./public'))

app.all('*', function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  // res.header('Access-Control-Allow-Headers', 'X-Requested-With, mytoken')
  res.header('Access-Control-Allow-Headers', 'X-Requested-With, Authorization')
  res.setHeader('Content-Type', 'application/json;charset=utf-8')
  res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With')
  res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS')
  res.header('X-Powered-By', ' 3.2.1')
  if (req.method == 'OPTIONS') res.send(200)
  /*让options请求快速返回*/ else next()
})
app.use('/api',router)

// app.use('/api',router.post('/upload',async(req,res)=>{
//   const {name,size,type,offset,hash,grapSize} = req.body
//   const {file} =req.files

//   const ext = extname(name)
//   // 创建目录
//   const dir = mkdirSync(resolve(__dirname,`./public/upload/`),{recursive:true})
//   const filename = resolve(__dirname,`./public/upload/${hash}${ext}`)
//   if(Number(offset)){
//     if(!existsSync(filename)){
//       res.status(400).send({message:'文件不存在'})
//       return
//     }
    
//     // 追加文件
//     await appendFile(filename,file.data)

//     if(Number(offset) + Number(grapSize) >= Number(size)){
//       res.send({data:{
//         code:200,
//         url:'http://localhost:4000/upload/'+hash+ext
//       }})
//       return
//     }
//     res.send({data:'appended'})
    
//     return
//   }
  
//   await writeFile(filename,file.data)
//   res.send({data:'created'})
// }))


app.listen(8080,()=>{
  console.log('服务运行在 http://localhost:8080');
})