/*
	TaskManager.js
		In-memory tasks list for illustrating use of authentication

    This is intended as a sample only.

 Copyright (c) Microsoft Corporation
 All Rights Reserved
 Apache License 2.0

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/*
	TaskManager.js - simple task management class with functions
*/
(function() {

	var util = require('util');
	var restify = require('restify');

	/*
	*	logger - handler to log module
	*	authManager - handler for the authentication module
	*/
	var TaskManager = function( logger, authManager) {
		this.allTasks = []; // global list of all tasks
		this.log = logger;
		this.authManager = authManager;
	}

	TaskManager.prototype.save = function( taskItem, callback) 
	{
		allTasks.push(taskItem);
		callback( null);
	}

	TaskManager.prototype.remove = function( taskRef, callback) 
	{
		// Remove from in-memory store ... just return back happily
		// ToDo: Removal code
		callback( null);
	}

	TaskManager.prototype.find = function( taskRef, callback) 
	{
		var resultsFound;

		if ( (taskRef == null) || (taskRef.owner == null)) {
			resultsFound = this.allTasks;
		} else {
	
			// Find in memory store ... just return back found results

			resultsFound = [];
			this.allTasks.forEach( function( item, i) {

				if ( item.owner == taskRef.owner) {
					resultsFound.push(item);
				}
			});
		}

		if (resultsFound.length > 0 ) {
			callback( null, resultsFound);
		} else {
			callback( "No Task Found", null);
		}
	}

	TaskManager.prototype.findAll = function( taskRef)
	{
		// Find in memory store ... just return back all items
		// ToDo: Process filters found in the taskRef

        if (!this.authManager.getOwner()) {

            this.log.warn( "You did not pass an owner when listing tasks.");
            return null;
        } else {

			data = this.allTasks;

	        if (!data.length) {
	            this.log.warn( "There are no tasks found. Add one!");
	        } else {

	            this.log.info(data);
	        }

        	return data;
        }
	}

	// Create a task
	var TaskItem = function() {
		this.owner = null;
		this.task = null;
		this.completed = false;
		this.date = Date();
	}

	TaskItem.prototype.save = function( callback)
	{
		// Store in-memory for now ... just return back happily
		this.allTasks.push( this);
		callback( null);
	}
	

	TaskManager.prototype.createTask = function(req, res, next) {

	    // Resitify currently has a bug which doesn't allow you to set default headers
	    // This headers comply with CORS and allow us to mongodbServer our response to any origin

	    res.header("Access-Control-Allow-Origin", "*");
	    res.header("Access-Control-Allow-Headers", "X-Requested-With");

	    // Create a new TaskItem model, fill it up and save it to Mongodb
	    var _task = new TaskItem();

	    if (!req.params.task) {
	        req.log.warn({
	            params: p
	        }, 'createTodo: missing task');
	        next(new MissingTaskError());
	        return;
	    }

	    _task.owner = this.authManager.getOwner();
	    _task.task = req.params.task;
	    _task.date = new Date();

	    err = null;
		this.allTasks.push( _task);

        res.send(201, _task);
	    return next();
	}


	// Delete a task by name

	TaskManager.prototype.removeTask = function(req, res, next) {

	    this.remove({
	        task: req.params.task,
	        owner: this.authManager.getOwner()
	    }, function(err) {
	        if (err) {
	            req.log.warn(err,
	                'removeTask: unable to delete %s',
	                req.params.task);
	            next(err);
	        } else {
	            this.log.info('Deleted task:', req.params.task);
	            res.send(204);
	            next();
	        }
	    });
	}

	// Delete all tasks

	TaskManager.prototype.removeAll = function(req, res, next) {
		// Remove from in-memory store ... just return back happily
		this.allTasks = [];
	    res.send(204);
	    return next();
	}


	// Get a specific task based on name

	TaskManager.prototype.getTask = function(req, res, next) {

	    this.log.info('getTask was called for: ', this.authManager.getOwner());
	    this.find(
	    	{ owner: this.authManager.getOwner()},
	    	function(err, data) {
		        if (err) {
		            req.log.warn(err, 'get: unable to read %s', this.authManager.getOwner());
		            next(err);
		            return;
		        }

		        res.json(data);
		    });

	    return next();
	}

	/// Simple returns the list of TODOs that were loaded.

	TaskManager.prototype.listTasks = function (req, res, next) {
	    // Resitify currently has a bug which doesn't allow you to set default headers
	    // This headers comply with CORS and allow us to mongodbServer our response to any origin

	    res.header("Access-Control-Allow-Origin", "*");
	    res.header("Access-Control-Allow-Headers", "X-Requested-With");

	    this.log.info("listTasks was called for: ", this.authManager.getOwner());

	    var data = this.findAll( null);
	    if ( null != data) { res.json( data); }
	    return next();
	}

	///--- Errors for communicating something interesting back to the client

	function MissingTaskError() {
	    restify.RestError.call(this, {
	        statusCode: 409,
	        restCode: 'MissingTask',
	        message: '"task" is a required parameter',
	        constructorOpt: MissingTaskError
	    });

	    this.name = 'MissingTaskError';
	}
	util.inherits(MissingTaskError, restify.RestError);


	function TaskExistsError( taskOwner) {
	    assert.string( taskOwner, 'owner');

	    restify.RestError.call(this, {
	        statusCode: 409,
	        restCode: 'TaskExists',
	        message: taskOwner + ' already exists',
	        constructorOpt: TaskExistsError
	    });

	    this.name = 'TaskExistsError';
	}
	util.inherits(TaskExistsError, restify.RestError);


	function TaskNotFoundError( taskOwner) {
	    assert.string( taskOwner, 'owner');

	    restify.RestError.call(this, {
	        statusCode: 404,
	        restCode: 'TaskNotFound',
	        message: taskOwner + ' was not found',
	        constructorOpt: TaskNotFoundError
	    });

	    this.name = 'TaskNotFoundError';
	}

	util.inherits(TaskNotFoundError, restify.RestError);

	module.exports = TaskManager;
})();
