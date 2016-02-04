#!/bin/sh

cd ~/stats/stats-scripts/

ruby dropin-stats.rb
ruby event-stats.rb
ruby reward-stats.rb
ruby traffic-stats.rb
ruby users-stats.rb
