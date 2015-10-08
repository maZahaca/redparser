#!/usr/bin/env bash

# specify here all the lodash modules you need, separate them by comma
include_modules=create,defaultsDeep,isEqual

# the path we age going to install lodash to
lodash_dir=lib
lodash_path=${lodash_dir}/lodash.js

./node_modules/.bin/lodash include=${include_modules} exports=amd,node,global -d -o ${lodash_path} && \
echo "lodash installed successfully";
