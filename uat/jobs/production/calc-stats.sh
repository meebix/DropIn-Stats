#!/bin/sh

cd ~/stats/uat/stats-scripts/

# Production
ENV=production /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-dropin-stats.rb
ENV=production /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-event-stats.rb
ENV=production /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-reward-stats.rb
ENV=production /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-traffic-stats.rb
ENV=production /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-users-stats.rb
