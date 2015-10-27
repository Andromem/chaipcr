(function () {
  'use strict';

  var App = window.App = angular.module('ThermalDiagnosticApp', [
    'ui.router',
    'ngResource'
  ]);

  App.value('host', 'http://localhost');

  App.config([
    '$stateProvider',
    '$urlRouterProvider',
    function ($stateProvider, $urlRouterProvider) {

      $urlRouterProvider.otherwise('diagnostic/');

      $stateProvider
      .state('diagnostic', {
        url: '/diagnostic/:id',
        templateUrl: './views/diagnostic.html',
        controller: 'DiagnosticWizardCtrl'
      });

    }
  ]);

  App.controller('DiagnosticWizardCtrl', [
    '$scope', 'Experiment', 'Status', '$interval', 'DiagnosticWizardService', '$stateParams', '$state',
    function($scope, Experiment, Status, $interval, DiagnosticWizardService, $params, $state) {
      var creating, fetchTempLogs, getExperiment, pollTemperatures, stopPolling, tempPoll, analyzeExperiment;
      Status.startSync();
      $scope.$on('$destroy', function() {
        Status.stopSync();
        return stopPolling();
      });
      tempPoll = null;
      $scope.lidTemps = null;
      $scope.blockTemps = null;
      creating = false;
      fetchTempLogs = function() {
        return Experiment.getTemperatureData($scope.experiment.id).then(function(resp) {
          var ref, ref1;
          if (resp.data.length === 0) return;
          $scope.lidTemps = DiagnosticWizardService.temperatureLogs(resp.data).getLidTemps();
          $scope.blockTemps = DiagnosticWizardService.temperatureLogs(resp.data).getBlockTemps();
          return $scope.elapsedTime = ((ref = resp.data[resp.data.length - 1]) != null ? (ref1 = ref.temperature_log) != null ? ref1.elapsed_time : void 0 : void 0) || 0;
        });
      };
      pollTemperatures = function() {
        return tempPoll = $interval(fetchTempLogs, 3000);
      };
      stopPolling = function() {
        $interval.cancel(tempPoll);
        return tempPoll = null;
      };
      getExperiment = function(cb) {
        cb = cb || angular.noop;
        return Experiment.get({
          id: $params.id
        }).$promise.then(function(resp) {
          return cb(resp);
        });
      };
      analyzeExperiment = function (id) {
        Experiment.analyze(id).then(function (resp) {
          $scope.analyzedExp = resp.data;
          console.log(resp.data);
        });
      };
      $scope.$watch(function() {
        return Status.getData();
      }, function(data, oldData) {
        var exp, newState, oldState, ref, ref1;
        if (!data) {
          return;
        }
        if (!data.experimentController) {
          return;
        }
        if (!data.experimentController.machine) {
          return;
        }
        newState = data.experimentController.machine.state;
        oldState = oldData != null ? (ref = oldData.experimentController) != null ? (ref1 = ref.machine) != null ? ref1.state : void 0 : void 0 : void 0;
        $scope.status = newState === 'Running' ? data.experimentController.machine.thermal_state : newState;
        if ($params.id && !$scope.experiment) {
          getExperiment(function(resp) {
            $scope.experiment = resp.experiment;
            if (resp.experiment.started_at && !resp.experiment.completed_at) {
              return pollTemperatures();
            } else {
              return fetchTempLogs();
            }
          });
        }
        if (newState === 'Idle' && !$params.id && !creating) {
          creating = true;
          exp = new Experiment({
            experiment: {
              guid: 'optical_cal'
            }
          });
          exp.$save().then(function(resp) {
            $scope.experiment = resp.experiment;
            return Experiment.startExperiment(resp.experiment.id).then(function() {
              console.log('created');
              return $state.go('diagnostic', {
                id: resp.experiment.id
              });
            });
          });
        }
        if (newState === 'Idle' && oldState !== 'Idle') {
          stopPolling();
          analyzeExperiment($params.id);
          return getExperiment(function(resp) {
            return $scope.experiment = resp.experiment;
          });
        }
      });

      $scope.stopExperiment = function() {
        return Experiment.stopExperiment({
          id: $scope.experiment.id
        }).then(function() {
          return window.location.assign('/');
        });
      };
    }
  ]);

})();