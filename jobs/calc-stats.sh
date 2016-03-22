#!/bin/bash

# The _environment variable gets passed a value from the inline bash command in crontab
_environment=$1

cd ~/stats/stats-scripts/

ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby dropin-stats.rb
ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby event-stats.rb
ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby reward-stats.rb
ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby traffic-stats.rb
ENV=$_environment /home/ubuntu/.rvm/rubies/ruby-2.2.1/bin/ruby users-stats.rb
