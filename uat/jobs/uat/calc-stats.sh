#!/bin/bash

_environment=$1

cd ~/stats/uat/stats-scripts/

ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-dropin-stats.rb
ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-event-stats.rb
ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-reward-stats.rb
ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-traffic-stats.rb
ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby uat-users-stats.rb
