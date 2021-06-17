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
  }

  buildName(element){
    if(element.tagName == "svg") {
      element = element.parentElement
    }
    const id = element.id
    const className = element.className
    const text = element.textContent ? element.textContent.trim() : ""
    let originalText = id ? id : (text ? text : className)
    let name = ""
    let nameArr = (typeof originalText == "string" && originalText.match(/[a-zA-Z0-9\u4e00-\u9fa5]+/g)) || ["DefaultElement"]
    for(const n of nameArr){
      if(name.length >= 30) break
      name += camelcase(n, {pascalCase: true, preserveConsecutiveUppercase: true})
    }
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
}
