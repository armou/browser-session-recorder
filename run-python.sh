#!/bin/bash
# Run Python Humanization-Playwright recorder

cd "$(dirname "$0")"
source venv-humanization/bin/activate
python3 recorder_python.py
