const express = require('express')
const router = express()
const {resolve} = require('path')
const fs = require('fs')
const fsExtra = require('fs-extra')
const path = require('path')

/**
 *  上传文件的断电续传
 *  1. 前端选择文件生成md5 --> 查看文件状态      ----->     文件是否存在
 *           file.slice()对文件切片 |                          | 是
 *                                 V          对比切片         V
 *                              上传切片      <-----    获取已上传的分片列表
 *                                 | 上传的文件夹名 md5、文件名为分片序号
 *                                 V
 *                              合并分片
 */

// 文件的上传地址
const uploadDir = resolve(__dirname,'./public/upload')


// 检查文件的MD5
router.get('/check/file',(req,res)=>{
  const {fileName,fileMd5Value} = req.query
  getChunkList(path.join(uploadDir,fileName),path.join(uploadDir,fileMd5Value),(data)=>{
    res.send(data)
  })
})

// 检查chunk的MD5
router.get('/check/chunk',(req,res)=>{
  const {md5,chunkIndex} = req.query
  fs.access(path.join(uploadDir,md5,chunkIndex),fs.constants.W_OK|fs.constants.F_OK,(err)=>{
    res.send({
      code: 200,
      exit: !err,
      desc: `Exit ${Number(!err)}`
    })
  })
})

// 合并md5文件
router.post('/merge',async (req,res)=>{
  const {size,fileName,md5,total} = req.body
  let fileArr = await listDir(path.join(uploadDir,md5))

  if(fileArr.length === total){
    res.send({
      code:200,
      path:await mergeFiles(path.join(uploadDir,md5),uploadDir,fileName,fileArr)
    })
  }else{
    res.send({
      code:0,
      message:'已上传的切片数据小于切片总数量'
    })
  }
  
})

// 上传
router.post('/upload',async (req,res)=>{
  const { total,index,fileMd5Value } = req.body
  console.log(req.files);
  if(req.files){
    const data = req.files.file.data
    // 上传路径是否存在
    if(!await isExist(uploadDir)){
      fs.mkdirSync(uploadDir,{recursive:true})
    }
    folderIsExit(`${uploadDir}/${fileMd5Value}`).then(async ()=>{
      fs.writeFileSync(`${uploadDir}/${fileMd5Value}/${index}`,data)
      res.send({
        code:200,
        message:`${index}号切片上传成功`
      })
    })
  
  
    // 判断文件夹是否存在，若不存在则创建文件夹
    function folderIsExit(folder){
      return new Promise((resolve,reject)=>{
        fsExtra.ensureDirSync(folder)
        resolve(true)
      })
    }
  }else{
    req.status(400).send({
      code:400,
      message:'参数错误'
    })
  }
  
})


/**
 * 合并文件
 * @param {*} filePath 
 * @param {*} uploadDir 
 * @param {*} fileName 
 * @param {*} size 
 */
 function mergeFiles(filePath,targetDir,fileName,fileArr){
  return new Promise((resolve,reject)=>{
      // 创建写入流
    const writer=  fs.createWriteStream(path.join(targetDir,fileName))
    fileArr.sort((x,y)=>x-y)

    fileArr = fileArr.map(file=>filePath+'/'+file)
    fileArr.forEach(item=>{
      writer.write(fs.readFileSync(item))
    })

    //关闭写入流，表明已没有数据要被写入可写流
    writer.end()

    writer.on('open', () => {
        console.log('文件已被打开', writer.pending)
    })
    writer.on('ready', () => {
        console.log('文件已为写入准备好', writer.pending)
    })
    writer.on('close', () => {
        console.log('文件已被关闭')
        console.log("总共写入了%d个字节", writer.bytesWritten)
        console.log('写入的文件路径是'+ writer.path)
        resolve(writer.path)
    })
  })

  // console.log(fileArr,path.join(targetDir, fileName));
  // concat(fileArr, path.join(targetDir, fileName), () => {
  //     console.log('Merge Success!')
  // })
}


/**
 * 获取文件的chunk列表
 * @param {*} filePath  文件路径
 * @param {*} folderPath   文件chunk路径
 * @param {*} callBack  
 */
async function getChunkList(filePath,folderPath,callBack){
  // 判断文件是否存在
  const isFileExist = await isExist(filePath)
  let result = null
  if(isFileExist){
    result = {
      stat:1,
      file:{
        isExist:true,
        name:filePath
      },
      desc:'file is exist'
    }
  }else{
    const isFolderExist = await isExist(folderPath)
    console.log(folderPath,isFolderExist);
    let fileList = []
    if(isFolderExist){
      // 获取文件夹列表
      fileList = await listDir(folderPath)
    }
    result = {
      stat:1,
      chunkList:fileList,
      desc:'folder list'
    }
  }
  callBack(result)
}


// 判断文件是否存在
function isExist(filePath){
  return new Promise((resolve)=>{
    fs.access(filePath,fs.constants.F_OK|fs.constants.W_OK,(err)=>{
      resolve(!(err && err.code==='ENOENT'))
    })
  })
}



// 列出文件夹下所有的文件
function listDir(path){
  return new Promise((resolve,reject)=>{
    fs.readdir(path,(err,data)=>{
      if(err){
        reject(err)
        return
      }
      // 把mac系统下的临时文件去掉
      if (data && data.length > 0 && data[0] === '.DS_Store') {
        data.splice(0, 1)
      }
      resolve(data)
    })
  })
}




module.exports = router