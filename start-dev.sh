#!/bin/bash

# Script para iniciar servidor com Node.js 20

# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Usar Node 20
nvm use 20

# Iniciar servidor
npm run dev
