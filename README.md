# QVAC Out of Office Writer

Enter your return date and your reason for being away (vacation, conference, etc.) and an on-device AI writes a professional out-of-office auto-reply message using those details. No cloud call, no API key.

## How it works

1. You type a return date (e.g. `next Monday`) and a reason for being away (e.g. `a family vacation`) into the two input fields and submit.
2. The server asks the on-device model for a genuinely professional 3-4 sentence auto-reply stating you're away until that date because of that reason, with no jokes.
3. The reply is streamed token-by-token and cleaned up (stripped of quotes and preambles like "Here's...").
4. `logic.js` checks that the message actually mentions both the return date and the reason (`mentionsBoth`) and isn't a refusal or too long; if either check fails, it falls back to a guaranteed professional template built directly from your exact return date and reason.

### Example

- Input: return date `next Monday`, reason `a family vacation`
- Typical output: `"Thank you for reaching out. I am currently out of the office on a family vacation and will return next Monday..."`

### QVAC functions used

- `loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 })` — loads the model on-device at startup (`src/gui.js`).
- `completion({ modelId, history, stream: true, completionOpts })` — generates the auto-reply, streamed via `run.tokenStream` (`src/logic.js`).
- `unloadModel({ modelId })` — releases the model when the server shuts down (`src/gui.js`).

## Run

```bash
npm install
npm start
```

Then open http://localhost:31029

The port can be overridden with the `PORT` environment variable.

## QVAC SDK version

`@qvac/sdk` ^0.19.0 (see `package.json`).

## License

MIT
