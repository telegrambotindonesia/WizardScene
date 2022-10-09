WizardScene in Google Apps Script

---

## Requirement

[lumpia framework](https://lumpia.js.org) - `1Yo6vQRwjG5Gl9jeEF0g2tBTUa0XN5MyT4G_HeDpRr9DvabxhRcSdhPNj`  
Wizard library - `1qh5YcQ6JIQcBj97jouAzZmjuuZnTybJVXvyKNs07SobcTPxu-sIXU87R`

![image](https://graph.org/file/1fb304166f8fedff82a48.jpg)

## Example Using

```javascript
const { Scene, Stage } = WizardDua;
// create new client
const bot = new lumpia.init(token);
// handle webhook response with doPost
function doPost(e) {
  bot.doPost(e);
}
// create new session
const session = new Scene(
  'session_one', // id to define the session you can fill with anything
  // step handle
  (ctx) => {
    ctx.data = {}; // create temp database
    ctx.reply('Input your number');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.data.number = ctx.message.text; // now you can save user respon.
    ctx.reply(`Your number : ${ctx.message.text}`);
    return ctx.wizard.leave();
  }
);
// create new stage. you can fill with multiple stage.
const stage = new Stage([session]);
// use stage as middleware.
bot.use(stage.middleware());
// start command
bot.start((ctx) => ctx.reply('Started!'));
// if user send /login bot will running the current stage.
bot.cmd('login', (ctx) => {
  return stage.enter('session_one'); // enter the session which has id "stage_one"
});
```
