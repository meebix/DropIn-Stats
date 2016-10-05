#!/bin/bash

# The _environment variable gets passed a value from the inline bash command in crontab
_environment=$1

cd ~/stats/mysql-scripts/

ENV=$_environment /usr/bin/nodejs app-params-table.js
ENV=$_environment /usr/bin/nodejs bar-table.js
ENV=$_environment /usr/bin/nodejs events-table.js
ENV=$_environment /usr/bin/nodejs installation-table.js
ENV=$_environment /usr/bin/nodejs loyalty-levels-table.js
ENV=$_environment /usr/bin/nodejs role-table.js
ENV=$_environment /usr/bin/nodejs session-table.js
ENV=$_environment /usr/bin/nodejs timeline-table.js
ENV=$_environment /usr/bin/nodejs users-bar-algo-table.js
ENV=$_environment /usr/bin/nodejs users-bar-algo-dtl-table.js
ENV=$_environment /usr/bin/nodejs users-bar-algo-timeline-table.js
ENV=$_environment /usr/bin/nodejs users-events-table.js
ENV=$_environment /usr/bin/nodejs users-feedback-table.js
ENV=$_environment /usr/bin/nodejs users-groups-table.js
ENV=$_environment /usr/bin/nodejs users-promotions-table.js
ENV=$_environment /usr/bin/nodejs users-rewards-table.js
ENV=$_environment /usr/bin/nodejs users-table.js
