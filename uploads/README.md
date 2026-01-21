# Uploads folder

This folder is used for uploading ZIP files via the web interface.
When you push a ZIP file here, GitHub Actions will automatically:

1. Extract and build the exercise
2. Move it to the exercises/ folder
3. Update the manifest.json
4. Remove the ZIP file

The built exercise will be available on the website after Netlify redeploys.
