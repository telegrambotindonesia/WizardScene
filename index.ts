/** @copyright
 * Don't sale this source.
 * Copyright (C) 2021 Butthx <https://github.com/butthx>
 * Create at Monday 22 November 2021.
 * This source is a free software : you can redistribute it and/or modify
 * it under the terms of the MIT License as published.
 */
type MaybePromise<T> = T | Promise<T>;
type ContextFn = (ctx: any) => MaybePromise<void>;
interface DataScene {
  /**
   * Who was inside the scene?
   */
  userId: number;
  /**
   * Where he running the scene?
   */
  chatId: number;
  /**
   * Whetever scene is running or not.
   */
  sceneRunning: boolean;
  /**
   * Content of scene
   */
  sceneData: any;
  /**
   * Index of Content in the scene
   */
  sceneIndex: number;
}
interface StageOptions {
  /**
   * The scene id will be running.
   */
  defaultSceneId?: string;
}
class _scene {
  /**
   * The scene identification.
   * @type {string}
   */
  id!: string;
  /**
   * All Content of scene available at here.
   * @type {ContextFn[]}
   */
  handler!: Array<ContextFn>;
  /**
   * @constructor
   * Scene constructor.
   * @param {string} id - The scene identification, it must be different every scene. One id only can be use with One scene, to prevent error or malfunction.
   * @param {ContextFn[]} - The scene handler, it must be an array of function. The function should be according to ContextFn.
   */
  constructor(id: string, ...handler: Array<ContextFn>) {
    this.id = id;
    this.handler = handler;
  }
  /**
   * Save or update the data in scene.
   * @param {DataScene} data - Data will be saved into scene.
   */
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
  /**
   * Find any saved data which is matches with filters.
   * @param {number} userId - Filter with user identification.
   * @param {number} chatId - Filter with chat identification.
   */
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
  /**
   * The available scenes.
   * @type {Map<string,_scene>}
   */
  scenes: Map<string, _scene> = new Map();
  /**
   * The current update context from lumpia.
   */
  ctx!: any;
  /**
   * @constructor
   * The Stage constructor.
   * @param {_scene[]} scenes - Array of scenes.
   */
  constructor(_scenes: Array<_scene>) {
    for (let scene of _scenes) {
      this.scenes.set(scene.id as string, scene as _scene);
    }
  }
  /**
   * Middleware function will be running in lumpia framework.
   */
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
  /**
   * Run the scene which is matches with given id.
   * @param {string} sceneId - The scene identification.
   */
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
  /**
   * Exit from running scene.
   */
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
  /**
   * Go to the next index of handler in running scene.
   */
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
  /**
   * Go to -1 index of handler in running scene.
   */
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
  /**
   * Change the index as you wish of handler in running scene.
   * The index start from zero and no more than the number of available handlers.
   */
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
