# StreamAi / Minionlab Auto Referral Bot

This bot automates the process of creating accounts and using referral codes for the StreamAi platform.

## UPDATE

because developer web stream not allowed temp email generator again, so im using gmail api for the ref.

## Features

- Automatically generates random email addresses.
- Uses proxies to avoid IP bans.
- Logs the created accounts.
- Handles email verification.

## Requirements

- Node.js v18 lts
- npm (Node Package Manager)
- email and password gmail (for password gmail not your password email, using password app [here](https://www.youtube.com/watch?v=_rAoQeKpEtM) for tutorial how to get it)

## Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/ahlulmukh/streamai-autoref.git
   cd streamai-autoref
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

3. Create a `proxy.txt` file if you want using proxy in the root directory and add your proxies (one per line).
   format proxy

   ```sh
   http://127.0.0.1:8080
   http://user:pass@127.0.0.1:8080
   ```

4. change `config.json.example` to `config.json`.

## Usage

1. Run the bot:

   ```sh
   node .
   ```

2. Follow the prompts to enter your referral code and the number of accounts you want to create.

## Output

- The created accounts will be saved in `accounts.txt` and `accountsBot.txt`.

## Notes

- Make sure to use valid proxies to avoid IP bans.
- The bot will attempt to verify the email up to 5 times before giving up.

## Stay Connected

- Channel Telegram : [Telegram](https://t.me/elpuqus)
- Channel WhatsApp : [Whatsapp](https://whatsapp.com/channel/0029VavBRhGBqbrEF9vxal1R)

## Disclaimer

This tool is for educational purposes only. Use it at your own risk.
