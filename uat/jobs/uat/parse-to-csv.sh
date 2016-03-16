#!/bin/sh

if [[ "$ENV" = "production" ]]
  then
    ENVIRONMENT = "production"
  else
    ENVIRONMENT = "development"
fi

echo ENVIRONMENT

cd ~/stats/uat/mysql-scripts/

# UAT
ENV=ENVIRONMENT /usr/bin/nodejs  uat-bar-table.js
ENV=ENVIRONMENT /usr/bin/nodejs  uat-events-table.js
ENV=ENVIRONMENT /usr/bin/nodejs  uat-loyalty-levels-table.js
ENV=ENVIRONMENT /usr/bin/nodejs  uat-role-table.js
ENV=ENVIRONMENT /usr/bin/nodejs  uat-timeline-table.js
ENV=ENVIRONMENT /usr/bin/nodejs  uat-users-events-table.js
ENV=ENVIRONMENT /usr/bin/nodejs  uat-users-rewards-table.js
ENV=ENVIRONMENT /usr/bin/nodejs  uat-users-table.js
