# Music Recommender

This project is a music app that uses AI to help with Spotify. You can type what you want, like a playlist for a certain mood or some songs to queue, and it will try to do that for you.

It can make playlists, suggest songs, look at playlists you already have, and even use the weather to help pick music.

It uses React and TypeScript for the frontend, and Python with FastAPI for the backend. It also connects to the Spotify API for music features and Open-Meteo for weather data.

## Setup

First, make a Spotify developer app and add this redirect URI:

`http://127.0.0.1:5173/api/auth/callback`

Then copy your Spotify client ID and client secret.

For the backend:

```bash
cd agent
cp .env.example .env
# add your keys to the .env file
# generate a SECRET_KEY if needed
python -c "import secrets; print(secrets.token_hex(32))"

pip install -r requirements.txt

For the frontend:

npm install
npm run dev

The app runs on http://localhost:5173 and the backend runs on port 8000.

How it works

The user connects their Spotify account, then types a message into the app.

The AI reads the message and uses different tools depending on what the user asked for. For example, it can search for songs, create a playlist, add songs to a playlist, queue tracks, check what is currently playing, or get the weather.

After that, it sends the result back to the app and shows it to the user.

Main tools
search for songs
get recommendations
create playlists
add songs to playlists
add songs to the Spotify queue
view user playlists
analyze playlists
check current playback
get weather for music suggestions
Adding more tools

If you want to add more tools, you can add the code in the backend tool files, add the schema, and then connect it in the tool dispatch part of the agent.
