(function () {
  'use strict';

  // Summaries controller
  angular
    .module('summaries')
    .controller('SummaryDetailController', SummaryDetailController);

  SummaryDetailController.$inject = ['$scope', '$state', '$stateParams', '$mdBottomSheet', 'Authentication', 'ChildsService', 'AgeFactory', 'SummaryDetailService', '$timeout', '$window'];

  function SummaryDetailController ($scope, $state, $stateParams, $mdBottomSheet, Authentication, ChildsService, AgeFactory, SummaryDetailService, $timeout, $window) {
    var vm = this;
    
    vm.authentication = Authentication;
    if (!vm.authentication.user) return $state.go('authentication.signin');

    $scope.childlist = ChildsService.query();
    $scope.isLoadedData = false;
    $scope.now = new Date();
    $scope.initialChildIndex = $stateParams.childIndex ? $stateParams.childIndex : 0;

    $scope.Math = window.Math;
    $scope.selectedEvent1 = 'nursing';
    $scope.selectedEvent2 = 'pumping';
    $scope.selectChoice = {
      bottleContent: 'All'
    }

    $scope.resourceList = {
      'nursing': {
        path: 'nursing.svg',
        color: '#AB5ABD',
        label: 'Nursing Sessions Per Day'
      },
      'pumping': {
        path: 'pump.svg',
        color: '#AB5ABD',
        label: 'Pumping Sessions Per Day'
      },
      'bottle': {
        path: 'bottle.svg',
        color: '#67C36B',
        label: 'BottleFeedings Per Day'
      },
      'solidfood': {
        path: 'spoon.svg',
        color: '#67C36B',
        label: 'Solid Food Feedings Per Day'
      },
      'wet': {
        path: 'diaper1.svg',
        color: '#FECA4B',
        label: 'Wet Diapers Per Day'
      },
      'dirty': {
        path: 'diaper2.svg',
        color: '#FEAB73',
        label: 'Dirty Diapers Per Day'
      },
      'asleep': {
        path: 'sleep.svg',
        color: '#45B2FF',
        label: 'Cumulative Hours Per Day'
      },
      'miscellaneous': {
        path: 'miscellaneous.svg',
        color: '#E187AD',
        label: 'Occurrences Per Day'
      }
    };
    $scope.eventList = {
      'nursing': 'Nursing',
      'pumping': 'Pumping',
      'bottle': 'Bottle',
      'solidfood': 'Solid Food',
      'wet': 'Wet Diapers',
      'dirty': 'Dirty Diapers',
      'asleep': 'Sleep',
      'miscellaneous': 'Miscellaneous'
    };
    $scope.childlist.$promise.then(function (result) {
      $scope.isLoadedData = true;
      $scope.startDate = new Date(moment().subtract(6, 'days'));
      $scope.endDate = new Date();
      $scope.reportType = 'summary';
      $scope.child = $scope.childlist[$scope.initialChildIndex];
      $scope.calculateSummary($scope.child);
    });

    $scope.calculateSummary = function(child) {
      var dayBeginsAt = child.dayBeginsAt.match(/(\d+)\:(\d+) (\w+)/);

      var dayBeginHour = dayBeginsAt[1];
      var dayBeginMinutes = dayBeginsAt[2];
      var dayPM = dayBeginsAt[3];
      if (dayPM === 'PM') dayBeginHour = dayBeginHour % 12 + 12;
      var nightBeginsAt = child.nightBeginsAt.match(/(\d+)\:(\d+) (\w+)/);
      var nightBeginHour = nightBeginsAt[1];
      var nightBeginMinutes = nightBeginsAt[2];
      var nightPM = nightBeginsAt[3];
      if (nightPM === 'PM') nightBeginHour = nightBeginHour % 12 + 12;
      child.dayHourList = [];
      var i = 0;
      for (i = 0; i < 24; i++) {
        var tmpHour = dayBeginHour * 1 + i;
        var apm = ' am';
        if (tmpHour > 11 && tmpHour < 24) {
          apm = ' pm';
        }
        if (tmpHour > 12) {
          tmpHour = tmpHour % 12;
        }
        if (tmpHour === 0) {
          tmpHour = 12;
        }
        child.dayHourList.push(tmpHour + apm);
      }
      child.dayBeginHour = dayBeginHour > 12 ? dayBeginHour % 12 : dayBeginHour * 1;
      if (dayPM === 'PM') {
        if (child.dayBeginHour === 0) {
          child.dayBeginHour = 12;
        }
        child.dayBeginHour = child.dayBeginHour + ' pm';
      } else {
        if (child.dayBeginHour === 0) {
          child.dayBeginHour = 12;
        }
        child.dayBeginHour = child.dayBeginHour + ' am';
      }
      child.nightBeginHour = nightBeginHour > 12 ? nightBeginHour % 12 : nightBeginHour * 1;
      if (nightPM === 'PM') {
        if (child.nightBeginHour === 0) {
          child.nightBeginHour = 12;
        }
        child.nightBeginHour = child.nightBeginHour + ' pm';
      } else {
        if (child.nightBeginHour === 0) {
          child.nightBeginHour = 12;
        }
        child.nightBeginHour = child.nightBeginHour + ' am';
      }
      var oneDay = 24 * 60 * 60 * 1000;
      var dateRange = Math.round(Math.abs($scope.endDate.getTime() - $scope.startDate.getTime()) / oneDay);
      var dayNightList = {};

      var tmpDate = new Date($scope.startDate);
      for (i = 0; i <= dateRange+1; i++) {
        var tmpDateString = tmpDate.getFullYear() + '-' + (tmpDate.getMonth() + 1) + '-' + tmpDate.getDate();
        var dayBeginDate = new Date(tmpDate);
        dayBeginDate.setHours(dayBeginHour);
        dayBeginDate.setMinutes(dayBeginMinutes);
        dayBeginDate.setSeconds(0);
        var nightBeginDate = new Date(tmpDate);
        nightBeginDate.setHours(nightBeginHour);
        nightBeginDate.setMinutes(nightBeginMinutes);
        nightBeginDate.setSeconds(0);
        dayNightList[tmpDateString] = {
          dayBeginDate: dayBeginDate,
          nightBeginDate: nightBeginDate
        };
        tmpDate.setDate(tmpDate.getDate() + 1);
      }
      var startDate = new Date($scope.startDate);
      startDate.setHours(dayBeginHour);
      startDate.setMinutes(dayBeginMinutes - 1);
      startDate.setSeconds(59);
      var endDate = new Date($scope.endDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setHours(dayBeginHour);
      endDate.setMinutes(dayBeginMinutes);
      endDate.setSeconds(0);

      var summary = SummaryDetailService.query({ childId: child._id, startDate: startDate, endDate: endDate, dayNight: dayNightList, event1: $scope.selectedEvent1, event2: $scope.selectedEvent2 });
      summary.$promise.then(function(res) {
        child.summary = res[0];
        $scope.drawChart(child);
      });
    };

    $scope.openBottomSheet = function() {
      // $mdBottomSheet.show({
      //   template: '<md-bottom-sheet class="md-list md-has-header md-grid" layout="column"><md-subheader>Share</md-subheader><md-list layout="row" layout-align="center center"> <md-item><div><md-button class="md-padding"><md-icon md-font-set="material-icons"> mail </md-icon><div> Email </div></md-button></div></md-item><md-item><div><md-button class="md-padding"><md-icon md-font-set="material-icons"> subject </md-icon><div class="md-grid-text"> Subject </div></md-button></div></md-item><md-item><div><md-button class="md-padding"><md-icon md-font-set="material-icons"> apps </md-icon><div class="md-grid-text"> Export (.csv) </div></md-button></div></md-item></md-list></md-bottom-sheet>'
      // });
    };

    $scope.getAgeOfBirth = function(birth) {
      return AgeFactory.getAgeOfBith(birth);
    };

    $scope.changeSlider = function(swiper) {
      $scope.child = $scope.childlist[swiper.activeIndex];
      $scope.initialChildIndex = swiper.activeIndex;
      $state.go('.', { childIndex: swiper.activeIndex }, { notify: false });
      $scope.calculateSummary($scope.child);
      $scope.$apply();
    };

    $scope.navigatePage = function(state) {
      $state.go(state, { childIndex: $scope.initialChildIndex });
    };

    $scope.drawChart = function(child) {
      var data = child.summary.details;
      var oneDay = 24 * 60 * 60 * 1000;
      var dateRange = Math.round(Math.abs($scope.endDate.getTime() - $scope.startDate.getTime()) / oneDay) + 3;

      var dayBeginsAt = child.dayBeginsAt.match(/(\d+)\:(\d+) (\w+)/);
      var dayBeginHour = parseInt(dayBeginsAt[1]);
      var dayPM = dayBeginsAt[3].toLowerCase();
      var timeStr = dayBeginHour+dayPM;
      var timeList = $scope.timeList = [timeStr];
      if (dayPM == 'pm') dayBeginHour + 12;
      for(var i = 1; i < 24; i++) {
        var hour = dayBeginHour + i;
        if (hour >= 12 && hour < 24) {
          hour = hour % 12;
          dayPM = 'pm';
        } else {
          hour = hour % 12;
          dayPM = 'am';
        }
        if(hour == 0) hour = 12;
        timeStr = hour+dayPM;
        timeList.push(timeStr);
      }
      timeList.push("")
      timeList = timeList.reverse();
      var group_data = [];
      var date_list = [];
      var bar_chart_group = [];
      for (var j = 0; j < dateRange; j++) {
        var new_date = moment($scope.startDate, "DD-MM-YYYY").add('days', j-1);
        var day = new_date.format('D');
        var month = new_date.format('M');
        var year = new_date.format('YYYY');
        date_list.push(year+'-'+month+'-'+day);
        bar_chart_group.push({
          x: j,
          y: 0
        })
      }
      for(var i = 0; i< timeList.length; i++) {
        for (j = 0; j < dateRange; j++) {
          var new_date = moment($scope.startDate, "DD-MM-YYYY").add('days', j);
          var day = new_date.format('D');
          var month = new_date.format('M');
          var year = new_date.format('YYYY');
          group_data.push({
            y: i,
            x: j,
            shape: 'circle'
          })
        }
      }

      $scope.data = [];

      //default groups
      $scope.data.push({
        key: 'Group',
        values: bar_chart_group,
        type: "bar",
        yAxis: 1
      });
      $scope.data.push({
        key: 'Group',
        values: group_data,
        type: "scatter",
        yAxis: 1
      });
      
      var events_list = $scope.showEventList = [{
        key: 'nursing',
        label: 'Nursing'
      }, {
        key: 'pumping',
        label: 'Pumping'
      }, {
        key: 'solidfood',
        label: 'Solid Food'
      }, {
        key: 'wet',
        label: 'Wet'
      }, {
        key: 'dirty',
        label: 'Dirty'
      }, {
        key: 'bottle',
        label: 'Bottle'
      }, {
        key: 'miscellaneous',
        label: 'Miscellaneous'
      }];
      $scope.showEventList = events_list.slice();
      $scope.showEventList.push({
        key: 'asleep',
        label: 'Sleep'
      });
      $scope.showEventList = _.map($scope.showEventList, function(item) {
        item.disabled = false;
        return item;
      });

      var events_times = [];
      events_list.forEach(function(event) {
        data[event.key] = _.map(data[event.key], function(item) {
          var x = date_list.indexOf(item.date);
          var timeArray = item.time.match(/(\d+)\:(\d+) (\w+)/);
          var apm = timeArray[3].toLowerCase();
          var hour = parseInt(timeArray[1]) || 12;
          var timeStr = hour+apm;
          var y = timeList.indexOf(timeStr);
          var m = parseInt(timeArray[2]) / 60;
          y = y - m;

          events_times.push({
            key: y,
            time: item.time.toLowerCase()
          });
          return {
            x: x,
            y: y,
            contents: item.contents,
            duration: item.duration,
            volume: item.volume,
            note: item.note
          };
        });
        $scope.data.push({
          key: event.label,
          values: data[event.key],
          type: "scatter",
          yAxis: 1
        });
      });

      if (data.sleep.length > 0) {
        data.sleep = _.map(data.sleep, function(item) {
          var x = date_list.indexOf(item.date);
          var startPoint = 0;
          var y = item.duration / 60;          

          var hour = Math.floor(item.duration / 60);
          var minute = item.duration % 60;
          var duration = hour+":"+minute;

          if (item.time != "") {
            var timeArray = item.time.match(/(\d+)\:(\d+) (\w+)/);
            var apm = timeArray[3].toLowerCase();
            var hour = parseInt(timeArray[1]) || 12;
            var timeStr = hour+apm;
            startPoint = timeList.indexOf(timeStr);
            var m = parseInt(timeArray[2]) / 60;
            startPoint = startPoint - m;
          }
          events_times.push({
            key: startPoint,
            time: item.time.toLowerCase()
          });
          return {
            x: x,
            y: y,
            start: startPoint,
            asleepDateString: item.asleepDateString,
            awakeDateString: item.awakeDateString,
            sleepTime: item.asleepTime,
            awakeTime: item.awakeTime==""?child.dayBeginsAt:item.awakeTime,
            note: item.note,
            index: item.index
          };
        });
        $scope.data.push({
          key: 'Sleep',
          values: data.sleep,
          type: "bar",
          yAxis: 1
        });
      }
      
      var y = d3.time.scale()
        .domain(d3.extent(group_data, function(d) { return d.y; }));

      $scope.margin = {top: 30, right: 20, bottom: 50, left: 60};
      $scope.chartHeight = 480;
      $scope.chartWidth = 80 * dateRange;
      if ($scope.chartWidth < $window.innerWidth) {
        $scope.chartWidth = $window.innerWidth - 50;
      }
      $scope.options = {
        chart: {
          type: 'multiChart',
          height: $scope.chartHeight,
          width: $scope.chartWidth,
          margin: $scope.margin,
          color: d3.scale.category10().range(),
          scatter: {
            onlyCircles: true
          },
          tooltip: {
            contentGenerator: function (key, x, y, e, graph) {
              if (key.data) {
                var data = key.data;
                var sleepTime = data.sleepTime!=undefined?data.sleepTime:child.dayBeginsAt;
                var awakeTime = data.awakeTime!=undefined?data.awakeTime:child.dayBeginsAt;
                var sleepString = data.asleepDateString + " " + sleepTime + ' ~ ' + data.awakeDateString + ' ' + awakeTime;
                var ms = moment(new Date(data.awakeDateString + ' ' + awakeTime), 'DD/MM/YYYY HH:mm:ss').diff(moment(new Date(data.asleepDateString + " " + sleepTime), 'DD/MM/YYYY HH:mm:ss'));
                var d = moment.duration(ms);
                var duration = d.format('m') * 1;
                duration = Math.floor(duration/60) + 'h ' + (duration%60) + 'm';
                var sleepDateStr = $scope.updateDateFormat(data.asleepDateString);
                var awakeDateStr = $scope.updateDateFormat(data.awakeDateString);
                
                return '<p>'+data.key+'</p><p>Asleep: '+sleepDateStr + ' '+$scope.updateTimeFormat(sleepTime)+'</p><p>Awake: '+awakeDateStr + ' '+$scope.updateTimeFormat(awakeTime)+'</p><p>'+duration+'</p><p>'+data.note+'</p>';
              } else {
                var data = key.point;
                var series = key.series;
                var key = series[0].key;
                if (key != 'Group') {
                  var timeData = _.find(events_times, function(item) {
                    return item.key == data.y
                  });
                  var time = timeData!=undefined?timeData.time:'';
                  var date = $scope.updateDateFormat(date_list[data.x]);
                  if (key == 'Nursing') {
                    return '<p>'+key+'</p><p>'+date+' '+$scope.updateTimeFormat(time)+'</p><p>'+$scope.updateDurationFormat(data.duration)+'</p><p>'+data.note+'</p>';
                  } else if (key == 'Pumping'){
                    return '<p>'+key+'</p><p>'+date+' '+$scope.updateTimeFormat(time)+'</p><p>'+$scope.updateDurationFormat(data.duration)+'</p><p>'+data.volume+'</p><p>'+data.note+'</p>';
                  } else if (key == 'Bottle') {
                    return '<p>'+key+'</p><p>'+date+' '+$scope.updateTimeFormat(time)+'</p><p>'+data.contents+'</p><p>'+data.volume+' oz</p><p>'+data.note+'</p>';
                  } else if (key == 'Solid Food') {
                    return '<p>'+key+'</p><p>'+date+' '+$scope.updateTimeFormat(time)+'</p><p>'+data.note+'</p>';
                  } else if (key == 'Wet') {
                    return '<p>Wet Diaper</p><p>'+date+' '+$scope.updateTimeFormat(time)+'</p><p>'+data.note+'</p>';
                  } else if (key == 'Dirty') {
                    return '<p>Dirty Diaper</p><p>'+date+' '+$scope.updateTimeFormat(time)+'</p><p>'+data.note+'</p>';
                  } else if (key == 'Miscellaneous') {
                    var label = data.contents;
                    if (label == '') label = key;
                    return '<p>'+label+'</p><p>'+date+' '+$scope.updateTimeFormat(time)+'</p><p>'+data.note+'</p>';
                  }
                }            
              }
            }
          },
          bars1: {
            dispatch: {
              renderEnd: function(e) {
                $timeout(function() {
                  var removePathCount = 25 * dateRange;
                  if(d3.selectAll('.nv-point-paths path')[0].length >= removePathCount) {
                    d3.selectAll('.nv-point-paths path')[0].forEach(function(item, i) {
                      if (i < removePathCount) {
                        item.remove();
                      }
                    })
                  }
                  var yScale = d3.scale.linear()
                      .range([0, $scope.chartHeight - $scope.margin.bottom - $scope.margin.top])
                      .domain(d3.extent(group_data, function(d) { return d.y; }));
                  var oldXTranslationList = [];
                  d3.select('.bars1Wrap .nv-groups .nv-series-0').selectAll('rect').each(function(d, i) {
                    if (d3.select('.nv-x .nv-axis').selectAll('.tick')[0][i]) {
                      var xAxisTransform = d3.transform(d3.select(d3.select('.nv-x .nv-axis').selectAll('.tick')[0][i]).attr('transform'));
                      var xAxisTransformX = xAxisTransform.translate[0];
                      var transform = d3.transform(d3.select(this).attr('transform'));
                      var x = transform.translate[0];
                      var y = transform.translate[1];
                      d3.select(this).attr('transform', 'translate('+xAxisTransformX+','+y+')');
                      oldXTranslationList.push({
                        old: x,
                        new: xAxisTransformX
                      });
                    }
                  });
                  d3.select('.bars1Wrap .nv-groups .nv-series-1').selectAll('rect').each(function(d) {
                    var transform = d3.transform(d3.select(this).attr('transform'));
                    var translate_x = transform.translate[0];
                    var y = yScale(d.start);
                    var newTransLateXObj = _.find(oldXTranslationList, function(item) {
                      return item.old == translate_x;
                    });
                    if (newTransLateXObj) {
                      d3.select(this).attr('transform', 'translate('+newTransLateXObj.new+',-'+y+')');
                      d3.select(this).attr('x', -15);
                      d3.select(this).attr('width', 10);
                      d3.select(this).attr('sleepGroup', 'group-'+d.index)
                    }
                    
                  });
                }, 100);
              }
            }
          },
          showDistX: false,
          showDistY: false,
          duration: 350,
          xAxis: {
            tickFormat: function(d) {
              var date = date_list[d];
              if (date) {
                return date.split('-')[1]+'/'+date.split('-')[2];
              } else {
                return "";
              }
            },
            ticks: dateRange,
          },
          yAxis: {
            scale: y
          },
          yAxis1: {
            ticks: 25,
            tickFormat: function(d){
              if (timeList[d]) {
                return timeList[d];
              } else {
                var timeData = _.find(events_times, function(item) {
                  return item.key == d
                });
                return timeData?timeData.time:'';
              }
            },
            tickSize: 0,
            axisLabelDistance: -5
          },
          dispatch: {
            renderEnd: function(e) {
              $timeout(function() {
                
              }, 100);              
            }
          },
          legend: {
            dispatch: {
              stateChange: function(e) {
                // _.map($scope.showEventList, function(item, i) {
                //   item.disabled = e.disabled[i+1];
                //   return item;
                // });
                // $scope.$apply();
              }
            }
          },
          callback: function(chart){
            d3.select(window).on('resize', function() {
              $scope.chartWidth = 80 * dateRange;
              if ($scope.chartWidth < $window.innerWidth) {
                $scope.chartWidth = $window.innerWidth - 50;
              }
              $scope.options.chart.width = $scope.chartWidth;
              $scope.api.updateWithOptions($scope.options);
            });
            var dayBeginsAt = child.dayBeginsAt.match(/(\d+)\:(\d+) (\w+)/);
            var dayBeginHour = parseInt(dayBeginsAt[1]);
            var dayBeginMinutes = parseInt(dayBeginsAt[2]);
            var dayPM = dayBeginsAt[3].toLowerCase();
            var timeStr = dayBeginHour+dayPM;
            var y1 = timeList.indexOf(timeStr);
            var m1 = parseInt(dayBeginMinutes) / 60;
            y1 = y1 - m1;
            var nightBeginsAt = child.nightBeginsAt.match(/(\d+)\:(\d+) (\w+)/);
            var nightBeginHour = parseInt(nightBeginsAt[1]);
            var nightBeginMinutes = parseInt(nightBeginsAt[2]);
            var nightPM = nightBeginsAt[3].toLowerCase();
            timeStr = nightBeginHour+nightPM;
            var y2 = timeList.indexOf(timeStr);
            var m2 = parseInt(nightBeginMinutes) / 60;
            y2 = y2 - m2;

            var svg = d3.select('#detail-chart').select('svg');
            var margin = chart.margin();
            var height = chart.height();
            var width = svg.style('width').split('px')[0];
            var yAxes = Math.floor(Math.random() * (chart.yAxis1.domain()[1] - 0)) + 0;

            var yScale = d3.scale.linear()
                .range([0 + margin.top, height - margin.bottom])
                .domain(d3.extent(group_data, function(d) { return d.y; }));
            var lineChartY1 = yScale(24 - y1);
            var lineChartY2 = yScale(24 - y2);
            d3.select(".legendWrap").attr('transform', 'translate(0,-30)');
            svg.append('line')
                .style('stroke', '#aaa')
                .style('stroke-width', '1px')
                .attr('x1', margin.left - 60)
                .attr('y1', lineChartY1)
                .attr('x2', width - margin.right)
                .attr('y2', lineChartY1);

            svg.append('line')
                .style('stroke', '#aaa')
                .style('stroke-width', '1px')
                .attr('x1', margin.left - 60)
                .attr('y1', lineChartY2)
                .attr('x2', width - margin.right)
                .attr('y2', lineChartY2); 

            svg.append("text")
                .attr("x", margin.left - 60)
                .attr("y", lineChartY1+10)
                .attr("dy", ".35em")
                .style("font-size", "12px")
                .text('Day');

            svg.append("text")
                .attr("x", margin.left - 60)
                .attr("y", lineChartY2+10)
                .attr("dy", ".35em")
                .style("font-size", "12px")
                .text('Night');

            d3.select('.bars1Wrap .nv-series-1').selectAll('.nv-bar').each(function(){
              this.addEventListener('mouseover', function(){
                  var index = d3.select(this).attr('sleepGroup');
                  d3.select('.bars1Wrap .nv-series-1').selectAll('.nv-bar').each(function(){
                    if (index == d3.select(this).attr('sleepGroup')) {
                      d3.select(this).classed('hover', false).classed('hover', true);
                    }
                  });
              }, false);
              this.addEventListener('mouseout', function(){
                  var index = d3.select(this).attr('sleepGroup');
                  d3.select('.bars1Wrap .nv-series-1').selectAll('.nv-bar').each(function(){
                    if (index == d3.select(this).attr('sleepGroup')) {
                      d3.select(this).classed('hover', false);
                    }
                  });
              }, false);
            });
          }
        }
      };
      $scope.updateDateFormat = function (dateStr)  {
        return dateStr.split('-')[1] + '/' + dateStr.split('-')[2] + '/' + (dateStr.split('-')[0].substr(-2))
      };
      $scope.updateTimeFormat = function(timeStr) {
        var timeArray = timeStr.match(/(\d+)\:(\d+) (\w+)/);
        return (parseInt(timeArray[1]) + ':' + (timeArray[2]) + ' ' + timeArray[3]);
      }
      $scope.updateDurationFormat = function(durationStr) {
        var durationArray = durationStr.match(/(\d+)\:(\d+)/);
        return (parseInt(durationArray[1]) + ':' + (durationArray[2]));
      }
      $scope.$watch('timeList', function(newVal, oldVal) {
        $scope.api.refresh();
      });
      $scope.selectedLegendItem = {
        'nursing': {
          selected: true,
          index: 2
        },
        'pumping': {
          selected: true,
          index: 3
        },
        'solidfood': {
          selected: true,
          index: 4
        },
        'wet': {
          selected: true,
          index: 5
        },
        'dirty': {
          selected: true,
          index: 6
        },
        'bottle': {
          selected: true,
          index: 7
        },
        'miscellaneous': {
          selected: true,
          index: 8
        },
        'sleep': {
          selected: true,
          index: 9
        }        
      };
      $scope.legendItemClick = function(event) {
        $scope.selectedLegendItem[event].selected = !$scope.selectedLegendItem[event].selected;
        var evt = new MouseEvent("click");
        d3.selectAll('.legendWrap .nv-series').each(function(d, i) {
          if ($scope.selectedLegendItem[event].index == i) {
            this.dispatchEvent(evt);
          }
        })
      }
    }
  }
}());
