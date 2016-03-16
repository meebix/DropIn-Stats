#!/bin/bash

_environment=$1

cd ~/stats/uat/mysql-scripts/

ENV=_environment /usr/bin/nodejs  uat-bar-table.js
ENV=_environment /usr/bin/nodejs  uat-events-table.js
ENV=_environment /usr/bin/nodejs  uat-loyalty-levels-table.js
ENV=_environment /usr/bin/nodejs  uat-role-table.js
ENV=_environment /usr/bin/nodejs  uat-timeline-table.js
ENV=_environment /usr/bin/nodejs  uat-users-events-table.js
ENV=_environment /usr/bin/nodejs  uat-users-rewards-table.js
ENV=_environment /usr/bin/nodejs  uat-users-table.js
