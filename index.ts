// Don't sale this source.
// Copyright (C) 2021 Butthx <https://github.com/butthx>
// Create at Monday 22 November 2021.
// This source is a free software : you can redistribute it and/or modify
//  it under the terms of the MIT License as published.
type MaybePromise<T> = T | Promise<T>;
// ctx:any because i can't import context from lumpia. it should be const {Context} = lumpia, but its undefined.
type ContextFn = (ctx: any) => MaybePromise<void>;
interface DataScene {
  userId: number;
  chatId: number;
  sceneRunning: boolean;
  sceneData: any;
  sceneIndex: number;
}
interface StageOptions {
  defaultSceneId?: string;
}
class _scene {
  id!: string;
  handler!: Array<ContextFn>;
  constructor(id: string, ...handler: Array<ContextFn>) {
    this.id = id;
    this.handler = handler;
  }
  save(data: DataScene) {
    let cache = CacheService.getScriptCache();
    if (!data.sceneRunning) {
      return cache.remove(
        `${this.id.replace(/\s+/g, '').toLowerCase()}${data.userId}${data.chatId}`
      );
    }
    // save cache for 1 hours.
    return cache.put(
      `${this.id.replace(/\s+/g, '').toLowerCase()}${data.userId}${data.chatId}`,
      JSON.stringify(data),
      3600
    );
  }
  find(userId: number, chatId: number) {
    let cache = CacheService.getScriptCache();
    let data = cache.get(`${this.id.replace(/\s+/g, '').toLowerCase()}${userId}${chatId}`);
    if (data && data !== null) {
      return JSON.parse(data);
    }
    return false;
  }
}
class _stage {
  scenes: Map<string, _scene> = new Map();
  ctx!: any;
  constructor(_scenes: Array<_scene>) {
    for (let scene of _scenes) {
      this.scenes.set(scene.id as string, scene as _scene);
    }
  }
  middleware() {
    return (ctx, next) => {
      this.ctx = ctx;
      //@ts-ignore
      this.ctx.wizard = this;
      //@ts-ignore
      this.ctx.sceneIndex = 0;
      for (let [id, scene] of this.scenes) {
        let data = scene.find(ctx.from.id, ctx.chat.id);
        if (data) {
          this.ctx.data = data.sceneData;
          //@ts-ignore
          this.ctx.sceneIndex = data.sceneIndex;
          if (data.sceneRunning && scene.handler[data.sceneIndex]) {
            return scene.handler[data.sceneIndex](this.ctx);
          }
        }
      }
      return next();
    };
  }
  enter(sceneId: string) {
    if (!this.ctx) {
      throw new Error(`ctx is undefined. please setup middleware first`);
    }
    let scene = this.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene with id ${sceneId} doesn't exist.`);
    }
    let dataScene = scene.find(this.ctx.from.id, this.ctx.chat.id);
    if (dataScene) {
      if (scene.handler[dataScene.sceneIndex]) {
        //@ts-ignore
        this.ctx.sceneIndex = dataScene.sceneIndex;
        return scene.handler[dataScene.sceneIndex](this.ctx);
      }
    } else {
      let data = {
        userId: this.ctx.from.id,
        chatId: this.ctx.chat.id,
        sceneRunning: true,
        sceneData: {},
        sceneIndex: 0,
      };
      scene.save(data);
      //@ts-ignore
      this.ctx.sceneIndex = 0;
      return scene.handler[0](this.ctx);
    }
  }
  leave() {
    for (let [id, scene] of this.scenes) {
      let dataScene = scene.find(this.ctx.from.id, this.ctx.chat.id);
      if (dataScene) {
        dataScene.sceneRunning = false;
        //@ts-ignore
        this.ctx.sceneIndex = 0;
        return scene.save(dataScene);
      }
    }
  }
  next() {
    for (let [id, scene] of this.scenes) {
      let dataScene = scene.find(this.ctx.from.id, this.ctx.chat.id);
      if (dataScene) {
        dataScene.sceneData = this.ctx.data;
        if (scene.handler[dataScene.sceneIndex + 1]) {
          dataScene.sceneIndex = dataScene.sceneIndex + 1;
        }
        this.ctx.sceneIndex = dataScene.sceneIndex;
        return scene.save(dataScene);
      }
    }
  }
  back() {
    for (let [id, scene] of this.scenes) {
      let dataScene = scene.find(this.ctx.from.id, this.ctx.chat.id);
      if (dataScene) {
        dataScene.sceneData = this.ctx.data;
        if (scene.handler[dataScene.sceneIndex - 1]) {
          dataScene.sceneIndex = dataScene.sceneIndex - 1;
        }
        this.ctx.sceneIndex = dataScene.sceneIndex;
        return scene.save(dataScene);
      }
    }
  }
  cursor(sceneIndex: number) {
    for (let [id, scene] of this.scenes) {
      let dataScene = scene.find(this.ctx.from.id, this.ctx.chat.id);
      if (dataScene) {
        dataScene.sceneData = this.ctx.data;
        if (scene.handler[sceneIndex]) {
          dataScene.sceneIndex = sceneIndex;
        }
        scene.save(dataScene);
        this.ctx.sceneIndex = dataScene.sceneIndex;
        return scene.handler[sceneIndex](this.ctx);
      }
    }
  }
}
var Scene = _scene;
var Stage = _stage;
