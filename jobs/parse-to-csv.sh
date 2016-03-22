#!/bin/bash

# The _environment variable gets passed a value from the inline bash command in crontab
_environment=$1

cd ~/stats/mysql-scripts/

ENV=$_environment /usr/bin/nodejs bar-table.js
ENV=$_environment /usr/bin/nodejs events-table.js
ENV=$_environment /usr/bin/nodejs loyalty-levels-table.js
ENV=$_environment /usr/bin/nodejs role-table.js
ENV=$_environment /usr/bin/nodejs timeline-table.js
ENV=$_environment /usr/bin/nodejs users-events-table.js
ENV=$_environment /usr/bin/nodejs users-rewards-table.js
ENV=$_environment /usr/bin/nodejs users-table.js
