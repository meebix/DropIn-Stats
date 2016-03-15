#!/bin/sh

cd ~/stats/uat/mysql-scripts/

# UAT
/usr/bin/nodejs  uat-bar-table.js
/usr/bin/nodejs  uat-events-table.js
/usr/bin/nodejs  uat-loyalty-levels-table.js
/usr/bin/nodejs  uat-role-table.js
/usr/bin/nodejs  uat-timeline-table.js
/usr/bin/nodejs  uat-users-events-table.js
/usr/bin/nodejs  uat-users-rewards-table.js
/usr/bin/nodejs  uat-users-table.js
