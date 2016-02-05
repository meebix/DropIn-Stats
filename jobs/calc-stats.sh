#!/bin/sh

cd ~/stats/stats-scripts/

/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby dropin-stats.rb
/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby event-stats.rb
/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby reward-stats.rb
/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby traffic-stats.rb
/home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby users-stats.rb
