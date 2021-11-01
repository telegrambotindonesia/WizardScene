## WizardScene in Google Apps Script 

---

## Requirement 
[lumpia framework](https://lumpia.js.org) - `1Yo6vQRwjG5Gl9jeEF0g2tBTUa0XN5MyT4G_HeDpRr9DvabxhRcSdhPNj`  
Wizard library - `19EqMaIYrXTLyMuc6Pvocb3R5kYpxyRUdfg48NYvl1anhGjFKIJjepz8k`
  
![image](https://graph.org/file/5e78e62e2dea7722a162c.png)
  
## Example Using 
```javascript
const {Scene,Stage} = Wizard; 
// create new client
const bot = new lumpia.init(token);
// handle webhook response with doPost
function doPost(e) {
  bot.doPost(e);
}
// create new stage 
const stage_one = new Stage(
  "stage_one",// id to define the stage. you can fill with anything 
  // step handle 
  (ctx) => {
    ctx.data = {} // create temp database
    return ctx.reply("Input your number") 
  },
  (ctx) => { 
    ctx.data.number = ctx.message.text // now you can save user respon.
    return ctx.reply(`Your number : `${ctx.message.text}`)
  }
)
// create new session/scene. you can fill with multiple stage. 
const session = new Scene([stage_one /*,stage_two,stage_three and anymore.*/ ])
// use session as middleware. 
bot.use( (ctx,next) => session.init(ctx,next) )
// start command
bot.start(ctx => ctx.reply('Started!'));
// if user send /login bot will running the current stage. 
bot.cmd("login",(ctx)=>{
  session.enter("stage_one") // enter the stage which has id "stage_one"
})
```

## Notes 
- For now wizard only working with update message. 
