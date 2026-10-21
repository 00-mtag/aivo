# AIVO frontend (Expo, React Native)

Run these in a terminal, starting in the AIVO folder (the one that contains `backend`).
Step 1 deletes the old Vite `frontend` folder, so make sure nothing in it is needed.

    rmdir /s /q frontend
    npx create-expo-app@latest frontend
    cd frontend
    rmdir /s /q app components constants hooks scripts

Then copy `app`, `src`, `supabase`, `.env.example` and `.gitignore` from this folder into `frontend`.
Copy `.env.example` to `.env` and fill in your Supabase URL and anon key.

    npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill react-native-svg react-native-maps expo-location
    npx expo start -c

Scan the QR code with Expo Go.
