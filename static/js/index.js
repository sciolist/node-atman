var app = angular.module('atman', ['ngRoute', 'ngResource', 'ngSanitize', 'ui.bootstrap']);

app.run(function ($rootScope, $modal, $sce) {
  for(var key in window.state) $rootScope[key] = window.state[key];
  $rootScope.alerts = [];

  $rootScope.addAlert = function (obj) {
    $sce.trustAsHtml(obj.message);
    $rootScope.alerts.unshift(obj);
  }

  $rootScope.closeAlert = function (alert) {
    var idx = $rootScope.alerts.indexOf(alert)
    if(idx>=0) $rootScope.alerts.splice(idx, 1);
  }
});


app.config(function($httpProvider) {
    function handleError($rootScope, $q) {
      function success(response) {
        return response;
      }
      function error(response) {
          var status = response.status;
          if (status === 401) {
              window.location = $rootScope.config.root;
              return;
          }
          if (status === 500) {
            $rootScope.addAlert({
              message: response.headers('message') || 'An error occured',
              type: 'danger'
            });
          }
          return $q.reject(response);
      }
      return function (promise) {
          return promise.then(success, error);
      }
    };
    $httpProvider.responseInterceptors.push(handleError);
});

app.config(function($locationProvider, $routeProvider) {
  var rp = $routeProvider;
  rp.when('/', { controller: 'dashboard', templateUrl: './ng-templates/main.html' });
  rp.otherwise({ redirectTo: '/' });
});

app.controller('dashboard', function () {
});

app.provider('navigation', function () {
  var result = { list: [] };
  result.deactivate = function () { _.each(this.list, function (a) { a.inactivate() }) };

  result.activate = function (path) {
    for(var i=0; i<this.list.length; ++i) {
      if(this.list[i].cn !== path) continue;
      this.list[i].activate();
      break;
    }
  }

  function makeArea(src) {
    var opts = {
      template: './ng-templates/include/main-navigation-item.html',
      toggle: function() { this.active ? this.inactivate() : this.activate(); },
      inactivate: function() { this.active = false; },
      activate: function() {
        for(var i=0; i<result.list.length; ++i) result.list[i].inactivate();
        this.active = true;
      }
    };
    for(var key in src) opts[key] = src[key];
    return opts;
  }

  return {
    svc: result,
    push: function (value) { result.list.push(makeArea(value)); },
    $get: function() { return result; }
  };
});

app.controller('sidebar', function ($scope, $location, navigation) {
  $scope.navigation = navigation.list;
  $scope.navigate = function (item) {
    if(!item || !item.href) return;
    if($scope.alerts) $scope.alerts.length = 0;
  }
});

