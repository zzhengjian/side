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

import browser from 'webextension-polyfill'
import scrollIntoViewIfNeeded from 'scroll-into-view-if-needed'
import LocatorBuilders from './locator-builders'
import TargetSelector from './target-selector'
import NameBuilder from './element-name'
import isDisplayed from '../third-party/isDisplayed'

const locatorBuilders = new LocatorBuilders(window)
const nameBuilder = new NameBuilder()

window.addEventListener('message', event => {
  if (event.data &&
      event.data.direction === 'from-page-script'){
      if (event.data.action === 'find') {
        const element = window.document.querySelector(event.data.query)
        highlight(element).then(() => {
          event.source.postMessage(
            {
              id: event.data.id,
              direction: 'from-content-script',
            },
            '*'
          )
        })
      }
      else if(event.data.action === 'select'){
          selectElement().then(target => {
            event.source.postMessage(
              {
                id: event.data.id,
                direction: 'from-content-script',
                result: target
              },
              '*'
            )
          })
      }
      else if(event.data.action === 'generateElement'){
        generateElement(event.data.builderOptions).then(target => {
          event.source.postMessage(
            {
              id: event.data.id,
              direction: 'from-content-script',
              result: target
            },
            '*'
          )
        })
      }
      else if(event.data.action === 'generateElements'){
        generateElements(event.data.builderOptions).then(target => {
          event.source.postMessage(
            {
              id: event.data.id,
              direction: 'from-content-script',
              result: target
            },
            '*'
          )
        })
      }
      else if(event.data.action === 'generateAllElements'){
        generateAllElements(event.data.builderOptions).then(target => {
          event.source.postMessage(
            {
              id: event.data.id,
              direction: 'from-content-script',
              result: target
            },
            '*'
          )
        })
      }
    }

})



let targetSelector

browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  
  if (message.action === 'select') {
    sendResponse(true)
    if (message.selecting) {
      startSelection()
    } else {
      cleanSelection()
    }
  }
})

browser.runtime
  .sendMessage({
    attachSelectorRequest: true,
  })
  .then(shouldAttach => {
    if (shouldAttach) {
      startSelection()
    }
  })
  .catch(() => {})

function startSelection() {
  targetSelector = new TargetSelector(function(element, win) {
    if (element && win) {
      const target = locatorBuilders.build(element)
      if (target != null && target instanceof Array) {
        if (target) {
          browser.runtime.sendMessage({
            action: 'select',
            selectTarget: true,
            target,
          })

        }
      }
    }
    targetSelector = null
  })
}

function cleanSelection() {
  targetSelector.cleanup()
  targetSelector = null
}

function selectElement(){
  return new Promise(res => {
    new TargetSelector(function(element, win) {
      if (element && win) {
        const target = locatorBuilders.build(element)
        if (target != null) {
          if (target) {
            res(target)
          }
        }
      }
    })
  })
}

function generateElement(options){
  return new Promise(res => {
    new TargetSelector(function(element, win) {
      if (element && win) {
        const target = locatorBuilders.build(element)
        nameBuilder.setBuilderOptions(options)
        const elementName = nameBuilder.buildName(element)
        if (target) {
          let ele = {}
          ele[elementName] = {
            type: target.slice(0,target.indexOf('=')),
            locator: target.slice(target.indexOf('=') + 1)
          }
          res(JSON.stringify(ele))
        }
      }
    })
  })
}

function generateElements(options){
  return new Promise(res => {
    new TargetSelector(function(element, win) {
      if (element && win) {
        //TODO: generateElements
        let elements = {}
        let xpathFilter = `xpath=.//*[not(ancestor::table)][normalize-space(translate(text(),' ',' '))][not(ancestor::select)][not(self::sup)][not(self::iframe)][not(self::frame)][not(self::script)]|.//input[not(ancestor::table)][@type!='hidden']|(.//img|.//select|.//i|.//a|.//h1|.//h2|.//h3|.//h4)[not(ancestor::table)]`
        let elementList = locatorBuilders.findElements(xpathFilter, element)
        for(const ele of elementList){
          if(!isDisplayed(ele)) continue
          const target = locatorBuilders.build(ele)
          nameBuilder.setBuilderOptions(options)
          const elementName = nameBuilder.buildName(ele)
          elements[elementName] = {
            type: target.slice(0,target.indexOf('=')),
            locator: target.slice(target.indexOf('=') + 1)
          }
        }
        if (elements) {
          res(JSON.stringify(elements))
        }
      }
    })
  })
}

function generateAllElements(options){
  return new Promise(res => {
    let element = document.querySelector('body')
    if (element) {
      //TODO: generateElements
      let elements = {}
      let xpathFilter = `xpath=.//*[not(ancestor::table)][normalize-space(translate(text(),' ',' '))][not(ancestor::select)][not(self::sup)][not(self::iframe)][not(self::frame)][not(self::script)]|.//input[not(ancestor::table)][@type!='hidden']|(.//img|.//select|.//i|.//a|.//h1|.//h2|.//h3|.//h4)[not(ancestor::table)]`
      let elementList = locatorBuilders.findElements(xpathFilter, element)
      for(const ele of elementList){
        if(!isDisplayed(ele)) continue
        const target = locatorBuilders.build(ele)
        nameBuilder.setBuilderOptions(options)
        let elementName = nameBuilder.buildName(ele)

        while(elements[elementName]){
          let elementNameSuffix = elementName.split('_')[0]
          let appendNum = elementName.split('_')[1]
          if(appendNum){
              appendNum = Number(appendNum) + 1
          }
          else{
              appendNum = 1
          }
          elementName = elementNameSuffix + '_' + appendNum
        }
        elements[elementName] = {
          type: target.slice(0,target.indexOf('=')),
          locator: target.slice(target.indexOf('=') + 1)
        }
      }
      if (elements) {
        res(JSON.stringify(elements))
      }
    }
  })
}

function highlight(element) {
  return new Promise(res => {
    const elementForInjectingStyle = document.createElement('link')
    elementForInjectingStyle.rel = 'stylesheet'
    elementForInjectingStyle.href = browser.runtime.getURL(
      '/assets/highlight.css'
    )
    ;(document.head || document.documentElement).appendChild(
      elementForInjectingStyle
    )
    const highlightElement = document.createElement('div')
    highlightElement.id = 'selenium-highlight'
    document.body.appendChild(highlightElement)
    const bodyRects = document.documentElement.getBoundingClientRect()
    const elementRects = element.getBoundingClientRect()
    highlightElement.style.left =
      parseInt(elementRects.left - bodyRects.left) + 'px'
    highlightElement.style.top =
      parseInt(elementRects.top - bodyRects.top) + 'px'
    highlightElement.style.width = parseInt(elementRects.width) + 'px'
    highlightElement.style.height = parseInt(elementRects.height) + 'px'
    highlightElement.style.position = 'absolute'
    highlightElement.style.zIndex = '100'
    highlightElement.style.display = 'block'
    highlightElement.style.pointerEvents = 'none'
    scrollIntoViewIfNeeded(highlightElement, { centerIfNeeded: true })
    highlightElement.className = 'active-selenium-highlight'
    setTimeout(() => {
      document.body.removeChild(highlightElement)
      elementForInjectingStyle.parentNode.removeChild(elementForInjectingStyle)
      res()
    }, 500)
  })
}
