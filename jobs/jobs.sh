#!/bin/sh

cd ~/stats/stat-scripts/

/usr/bin/nodejs  dropin-stats.js
/usr/bin/nodejs  event-stats.js
/usr/bin/nodejs  reward-stats.js
/usr/bin/nodejs  traffic-stats.js
/usr/bin/nodejs  user-stats.js
