'use strict';

// 项目初始化

const Command = require('@yzl-cli-dev/command')
const log = require('@yzl-cli-dev/log')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const semver = require('semver')

const TYPE_PROJEC = 'project'
const TYPE_COMPONENT = 'component'

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._argv[1].force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  async exec() {
    try {
      // 1. 准备阶段
      const projectInfo = await this.prepare()
      if (projectInfo) {
        // 2. 下载模板
        log.verbose('projectInfo', projectInfo)
        this.downloadTemplate()
      }
      // 3. 安装模板
    } catch (error) {
      log.error(error.message)
    }
  }

  // 准备工作
  async prepare() {
    const localPath = process.cwd()
    log.verbose('localPath', localPath)
    // 1. 判断当前目录是否为空
    if (!this.isDirEmpty(localPath)) {
      let ifContinue = false
      // 如果没有 force
      if (!this.force) {
        //  1.1 询问是否继续创建
        ifContinue = (await inquirer.prompt({
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: '当前文件夹不为空，是否继续创建项目'
        })).ifContinue
        if (!ifContinue) {
          return
        }
      }
      if (ifContinue || this.force) {
        // 2. 是否启动强制更新
        // 做二次确认
        const { confirmDelete } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirmDelete',
          default: false,
          message: '是否确认清空当前目录下的文件'
        })
        if (confirmDelete) {
          // 清空当前目录内的文件
          fse.emptyDirSync(localPath)
        }
      }
    }
    return this.getPorjectInfo()
  }

  // 获取项目信息
  async getPorjectInfo() {
    let projectInfo = {}
    // 1. 选择创建项目或组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: '请选择初始化类型',
      default: TYPE_PROJEC,
      choices: [
        {
          name: '项目',
          value: TYPE_PROJEC
        },
        {
          name: '组件',
          value: TYPE_COMPONENT
        }
      ]
    })
    if (type === TYPE_PROJEC) {
      // 2. 获取项目基本信息
      const project = await inquirer.prompt([{
        type: 'input',
        name: 'projectName',
        message: '请输入项目名称',
        default: '',
        validate: function (v) {
          // 首字符必须为英文
          // 尾字符必须为英文或数字，不能为字符
          // 字符仅支持 - _
          // 合法的：a , a-b, a_b, a-b-c, a-b1-c1, a_b1_c1
          // 非法的：1, a_, a-, a-1, a_1
          const done = this.async()
          setTimeout(() => {
            if (! /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/.test(v)) {
              done('请输入合法的项目名称!(首字符英文，结尾不能为字符，字符仅支持_-)')
              return
            }
            done(null, true)
          }, 0)
        },
        filter: function (v) {
          return v
        }
      }, {
        type: 'input',
        name: 'projectVersion',
        message: '请输入项目版本号',
        default: '1.0.0',
        validate: function (v) {
          const done = this.async()
          setTimeout(() => {
            if (!(!!semver.valid(v))) {
              done('请输入合法的版本号')
              return
            }
            done(null, true)
          }, 0)
        },
        filter: function (v) {
          // semver.valid 帮助处理版本号
          // v1.0.0 => 1.0.0
          if (semver.valid(v)) {
            return semver.valid(v)
          } else {
            return v
          }
        }
      }])
      projectInfo = {
        type,
        ...project
      }
    } else if (type === TYPE_COMPONENT) {

    }
    return projectInfo
  }

  // 是否是空文件夹
  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath)
    console.log(fileList)
    // 文件过滤(缓存文件认为是空)
    fileList = fileList.filter(file => (
      !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
    ))
    return !fileList || fileList.length <= 0
  }

  // 下载模板
  downloadTemplate() {
    // 1. 通过项目模板API获取项目模板信息
    // 1.1 通过egg搭建一套后端系统
    // 1.2 通过Npm存储项目模板
    // 1.3 将项目模板信息存储到mongodb数据库中
    // 1.4 通过egg获取mongodb中的数据并且通过API返回
  }

}

/**
 * 
 * @param {项目名称} argv[0]
 * @param {配置项} argv[1] 
 * @param {cmd对象} argv[2] 
 */
function init(argv) {
  // projectName, opt, cmdObj
  // console.log(projectName, opt, process.env.CLI_TARGET_PATH)
  new InitCommand(argv)
}


module.exports = init
module.exports.InitCommand = InitCommand