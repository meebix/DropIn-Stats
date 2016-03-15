#!/bin/sh

cd ~/stats/uat/stats-scripts/

# UAT
/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-dropin-stats.rb
/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-event-stats.rb
/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-reward-stats.rb
/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-traffic-stats.rb
/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-users-stats.rb
