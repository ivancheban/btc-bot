# Telegram Bitcoin Price Bot

This is a Telegram bot that provides real-time Bitcoin price updates. It's designed to run as a serverless function on Netlify and uses the CoinDesk API to fetch the latest Bitcoin price.

## Features

- Fetch current Bitcoin price on demand using the `/price` command.
- Automatic price updates when significant changes occur.
- Periodic price checks (when set up with GitHub Actions).
- Formatted price display with thousands separators and three decimal places.

## Setup

### Prerequisites

- A Telegram Bot Token (obtain from BotFather)
- A Netlify account
- A GitHub account

### Deployment Steps

1. Fork this repository to your GitHub account.

2. Set up a new site on Netlify:
   - Connect your GitHub repository to Netlify.
   - Set the build command to `npm install`.
   - Set the publish directory to `api`.

3. Set up environment variables in Netlify:
   - Go to Site settings > Build & deploy > Environment
   - Add a variable named `TOKEN` with your Telegram Bot Token as the value

4. Deploy your site on Netlify.

5. Set up the Telegram webhook:
   - Replace `<YOUR_BOT_TOKEN>` and `<YOUR_NETLIFY_URL>` in the following URL and open it in a browser:
        ```
        https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_NETLIFY_URL>/.netlify/functions/bot
        ```

### Setting Up Periodic Checks (Optional)

To enable periodic price checks, set up a GitHub Action:

1. In your GitHub repository, go to Actions > New workflow
2. Create a new file `.github/workflows/check-btc-price.yml` with the following content:

    ```yaml
    name: Check BTC Price

    on:
      schedule:
        - cron: '*/10 * * * *'
      workflow_dispatch:

    jobs:
      check-price:
        runs-on: ubuntu-latest
        steps:
        - name: Curl request and check response
          run: |
            response=$(curl -v -X POST ${{ secrets.NETLIFY_URL }} -H "Content-Type: application/json" -d '{"message":{"text":"/price"}}')
            echo "Response: $response"
            if [[ -z "$response" ]]; then
              echo "Error: No response received"
              exit 1
            else
              echo "Response received successfully"
            fi
          env:
            NETLIFY_URL: ${{ secrets.NETLIFY_URL }}
    ```

3. In your GitHub repository settings, go to Secrets and variables > Actions.
4. Add a new repository secret named `NETLIFY_URL` with your Netlify function URL as the value. For example, https://my-bitcoin-price-bot.netlify.app/.netlify/functions/bot

## Usage

Once set up, you can interact with the bot on Telegram:

- Send `/price` to get the current Bitcoin price.
- The bot will automatically send updates to the specified chat when there's a significant price change or after an hour has passed since the last update.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
