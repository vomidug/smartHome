#!/bin/bash
dirName=$(basename "$PWD")
rsync -L --exclude='./git/' --exclude='.gitignore' --exclude='node_modules/' -r ./* vps:/app/bots/${dirName}
ssh vps "cd /app/bots/${dirName}; docker-compose up --build -d"
