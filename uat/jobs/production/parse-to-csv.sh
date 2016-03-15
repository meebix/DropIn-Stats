#!/bin/sh

cd ~/stats/uat/mysql-scripts/

# Production
ENV=production /usr/bin/nodejs  uat-bar-table.js
ENV=production /usr/bin/nodejs  uat-events-table.js
ENV=production /usr/bin/nodejs  uat-loyalty-levels-table.js
ENV=production /usr/bin/nodejs  uat-role-table.js
ENV=production /usr/bin/nodejs  uat-timeline-table.js
ENV=production /usr/bin/nodejs  uat-users-events-table.js
ENV=production /usr/bin/nodejs  uat-users-rewards-table.js
ENV=production /usr/bin/nodejs  uat-users-table.js
