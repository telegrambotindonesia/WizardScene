// Don't sale this source.
// Copyright (C) 2021 Butthx <https://github.com/butthx>
// Create at Monday 1 November 2021.
// This source is a free software : you can redistribute it and/or modify
//  it under the terms of the MIT License as published.
var Stage = class {
  constructor(id,...handler){
    this.id = id 
    this.handler =  handler
  }
};
var Scene = class {
  /**
   * @param {Array} stage - Array<Stage>
   */
  constructor(stage){
    this.stage = stage || [];
    this.middleware = [];
    this.ctx = {};
    this.data = [];
  }
  /**
   * @param {Object} ctx - Composer 
   * @param {any} next - Next function
   */
  async init(ctx,next){
    try{
      let data = ScriptProperties.getProperty("wizard-session")
      if(data && data != null){
        this.data = JSON.parse(
          Utilities.newBlob(
            Utilities.base64Decode(data)
          ).getDataAsString()
        )
      }
      this.ctx = ctx 
      if(!ctx.update.message){
        return next()
      } 
      return this._run(next)
    }catch(e){
      return this.ctx.reply(`[StageError] [${e.message}]`)
    }
  } 
  /**
   * @private
   */
  async _run(next){
    try{
      if(this.ctx.update.message){
        let {from,chat} = this.ctx.update.message
        this.data.forEach((el,i)=>{
          if(el.from.id == from.id && el.chat.id == chat.id && el.running){
            this.stage.forEach((s)=>{
              if(el.stage.id == s.id){
                this.ctx["data"] = el.data
                if(s.handler[el.now]) s.handler[el.now](this.ctx)
                if(s.handler[Number(el.now+1)]){
                  el.now = Number(el.now+1) 
                }else{
                  el.now = 0 
                  el.running = false 
                  this.data.splice(i,1)
                }
                el.data = this.ctx.data
              }
            })
          }
        })
      }
      let data = Utilities.base64Encode(JSON.stringify(this.data))
      ScriptProperties.setProperty("wizard-session",data)
      return next()
    }catch(e){
      return this.ctx.reply(`[StageError] [${e.message}]`)
    }
  }
  /**
   * @param {string} id
   */
  async enter(id){
    try{
      if(this.ctx.update.message){ 
        let {from,chat} = this.ctx.update.message
        this.stage.forEach((s)=>{
          if(s.id == id){
            this.data.forEach((el)=>{
              if(el.from.id == from.id && el.chat.id == chat.id){
                el.running == true 
                el.stage.id = id 
                return this._run(()=>{})
              }
            })
            this.data.push({
              stage : {
                id : id
              },
              from : from,
              chat : chat, 
              now : 0, 
              running : true,
              data : {}
            })
            return this._run(()=>{})
          }
        })
      }
      return false
    }catch(e){
      return this.ctx.reply(`[StageError] [${e.message}]`)
    }
  }
}