#!/bin/sh

if [[ "$ENV" = "production" ]]
  then
    ENVIRONMENT = "production"
  else
    ENVIRONMENT = "development"
fi

echo ENVIRONMENT

cd ~/stats/uat/stats-scripts/

# Production
ENV=ENVIRONMENT /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-dropin-stats.rb
ENV=ENVIRONMENT /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-event-stats.rb
ENV=ENVIRONMENT /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-reward-stats.rb
ENV=ENVIRONMENT /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-traffic-stats.rb
ENV=ENVIRONMENT /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-users-stats.rb
