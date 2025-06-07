#!/bin/bash

source ~/jupyter-env/bin/activate
jupyter lab --notebook-dir=./notebooks --NotebookApp.token='password' --NotebookApp.password='password' --NotebookApp.open_browser=False
