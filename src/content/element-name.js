// Licensed to the Software Freedom Conservancy (SFC) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The SFC licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import camelcase from 'camelcase'

export default class NameBuilder {
  
  constructor() {
    // Instead, we simply assign global content window to this.win
    this.win = window
    const doc = this.win.document
    this.options = {pascalCase: true, preserveConsecutiveUppercase: true}
  }

  setBuilderOptions(options){
    this.options = {...this.options, ...options}
  }

  buildName(element){
    if(element.tagName == "svg") {
      element = element.parentElement
    }
    let attrList = ["id", "text", "class"]
    let originalText = this.nameCandidate(element, attrList)
    let name = ""
    let nameArr = (typeof originalText == "string" && originalText.match(/[a-zA-Z0-9\u4e00-\u9fa5]+/g)) || ["DefaultElement"]
    for(const n of nameArr){
      if(name.length >= 30) break
      name += n + ' '
    }
    name = camelcase(name, this.options)
    name = this.append(element, name)
    return name
  }

  append(element, name){
    const tag = element.tagName
    if(tag == "A"){
      name += "Link"
    }
    else if(tag == "TABLE"){
      name += "Table"
    }
    else if(tag == "I"){
      name += "Icon"
    }
    else if(tag.match(/h\d/)){
      name += "Title"
    }
    else if(tag == "INPUT"){
      name += "Input"
    }
    else if(tag == "IMG"){
      name += "Img"
    }
    return name
  }

  nameCandidate(element, configList){
    while(configList.length>0){
      let attribute = configList.shift()
      let name = ""
      if(attribute == "text" && !this.has2ChildElements(element)){
        name = element.textContent
      }
      else if(attribute == "class"){
        name = element.className
      }else{
        name = element[attribute]
      }
      name = name ? name.trim() : ""
      if(name){
        return name
      }
    }
  }

  has2ChildElements(element){
    if(element.childElementCount == 0){
      return false
    }
    if(element.childElementCount>=2){
      return true
    }
    let children = element.children
    let result = false
    for(let child of children){
      result = result || this.has2ChildElements(child)
    }
    return result
  }
}
