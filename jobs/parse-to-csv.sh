#!/bin/bash

_environment=$1

cd ~/stats/uat/mysql-scripts/

ENV=$_environment /usr/bin/nodejs  bar-table.js
ENV=$_environment /usr/bin/nodejs  events-table.js
ENV=$_environment /usr/bin/nodejs  loyalty-levels-table.js
ENV=$_environment /usr/bin/nodejs  role-table.js
ENV=$_environment /usr/bin/nodejs  timeline-table.js
ENV=$_environment /usr/bin/nodejs  users-events-table.js
ENV=$_environment /usr/bin/nodejs  users-rewards-table.js
ENV=$_environment /usr/bin/nodejs  users-table.js
