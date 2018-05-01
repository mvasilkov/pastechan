#!/bin/bash
npx google-closure-compiler --js_output_file static/editor.min.js --isolation_mode IIFE --module_resolution Node --process_common_js_modules --rewrite_polyfills false node_modules/jwt-decode/standalone.js node_modules/jwt-decode/lib/index.js node_modules/jwt-decode/lib/base64_url_decode.js node_modules/jwt-decode/lib/atob.js scripts/utf8.js scripts/editor.js
npx replace global\\.window window static/editor.min.js
