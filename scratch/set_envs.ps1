$vars = @{
    "NEXT_PUBLIC_FIREBASE_API_KEY" = "AIzaSyBFLzc4F7F_E9XidGRwB4EsAr5LN-Hu7i0"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" = "woc-platform-seoul-1234.firebaseapp.com"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID" = "woc-platform-seoul-1234"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" = "woc-platform-seoul-1234.firebasestorage.app"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" = "1021887439599"
    "NEXT_PUBLIC_FIREBASE_APP_ID" = "1:1021887439599:web:7c5741009dd928b8fd311a"
}

foreach ($key in $vars.Keys) {
    echo $vars[$key] | npx vercel env add $key production
}
