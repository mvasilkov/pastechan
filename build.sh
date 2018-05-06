#!/bin/bash
npx google-closure-compiler --js_output_file static/editor.min.js --isolation_mode IIFE --module_resolution Node --process_common_js_modules --rewrite_polyfills false node_modules/jwt-decode/standalone.js node_modules/jwt-decode/lib/index.js node_modules/jwt-decode/lib/base64_url_decode.js node_modules/jwt-decode/lib/atob.js scripts/utf8.js scripts/pow.js scripts/editor.js
MSYS2_ARG_CONV_EXCL=/global npx replace-in-file /global\\.window/g window static/editor.min.js --isRegex
