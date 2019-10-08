#===============================================================================

    dispatch.jl

    dispatches API GET requests to the appropriate act() method
    
===============================================================================#

import JSON
import DataStructures.OrderedDict
import Memento: debug, warn, error


"""
Parse GET request, dispatch to the appropriate `act` method, and return a 2-Tuple of a 
Boolean and a JSON string. Called by the Julia webserver in response to GET requests.
NB The API is documented in docs/juliaapi_new.txt.
"""
function dispatch(
    action_key      ::AbstractString,
    request_body    ::AbstractString;
    verify          ::Bool = false
)
    debug(logger, "at dispatch() with action \"$action_key\"")
    debug(logger, "request body: " * request_body)
	success = false
    const result = try
        ## NB. DefaultDict and DefaultOrderedDict constructors sometimes don't work
        ## on OrderedDict (https://github.com/JuliaLang/DataStructures.jl/issues/205)
        req_parsed = JSON.parse(request_body; dicttype = OrderedDict)
        #=
            Issue:
            By default the JSON parser converts Arrays and Dicts to type ::Any.
            It is important to annotate the type of data structures wherever
            they are known to avoid wasting time and mem`ory downstream.
            Since the data structures are specific to each action,
            this should generally be done in the generic act() methods.
        =#
        if !(action_key in keys(ACT))
            error(logger, "action \"$action_key\" is not recognized")
        end
        ## else
        const action = Val{ACT[action_key]}
        #
        const production_env = (get(ENV, "JULIA_ENV", nothing) == PRODUCTION_MODE)
        @static if !production_env
            ## this code is hidden from the parser on the BeagleBone
            if verify
                const verify_input = try
                    verify_request(action, req_parsed)
                catch()
                    warn(logger, "data supplied with \"$action_key\"" *
                        "request is in the wrong format")
                end ## try
            end ## if verify
        end ## if !production_env
        #
        debug(logger, "dispatching to act() from dispatch()")
        const response = act(action, req_parsed; out_format = pre_json_output)
        debug(logger, "response received from act() by dispatch()")
        debug(logger, repr(response))
        const json_response = JSON.json(response)
        #
        @static if !production_env
            ## this code is hidden from the parser on the BeagleBone
            if verify
                const verify_output = try
                    verify_response(action,
                        JSON.parse(json_response, dicttype = OrderedDict))
                catch()
                    warn(logger, "data returned from \"$action_key\"" *
                        " request is in the wrong format")
                end ## try
            end ## if verify
        end ## if !production_env
        #
        ## return value
		success = true
        json_response
    catch err
		JSON.json(fail(logger, err; bt = true) |> out(pre_json_output))
    end ## try
    
    const response_body = string(result)

    debug(logger, "returning from dispatch()")
    debug(logger, "success: $success")

    return (success, response_body)
end ## dispatch()


#==============================================================================#


## unused function
## get keyword arguments from request
# function get_kw_from_req(key_vec ::AbstractVector, req ::Associative)
#     pair_vec = Vector{Pair}()
#     for key in key_vec
#         if haskey(req, key)
#             push!(pair_vec, Symbol(key) => req[key])
#         end ## if
#     end ## for
#     return OrderedDict(pair_vec)
# end


## obsolete function
## testing function: construct `request_body` from separate arguments
# function args2reqb(
#     action ::String,
#     exp_id ::Integer,
#     calib_info ::Union{Integer,OrderedDict};
#     stage_id ::Integer =0,
#     step_id ::Integer =0,
#     ramp_id ::Integer =0,
#     min_reliable_cyc ::Real =5,
#     baseline_method ::String ="sigmoid",
#     baseline_cyc_bounds ::AbstractVector =[],
#     guid ::String ="",
#     extra_args ::OrderedDict =OrderedDict(),
#     wdb ::String ="dflt", ## "handle", "dflt", "connect"
#     db_key ::String ="default", ## "default", "t1", "t2"
#     db_host ::String ="localhost",
#     db_usr ::String ="root",
#     db_pswd ::String ="",
#     db_name ::String ="chaipcr",
# )
#     reqb = OrderedDict{typeof(""), Any}("calibration_info" => calib_info)
#
#     if action == "amplification"
#         reqb["experiment_id"] = exp_id
#         reqb["min_reliable_cyc"] = min_reliable_cyc
#         reqb["baseline_cyc_bounds"] = baseline_cyc_bounds
#         if step_id != 0
#             reqb["step_id"] = step_id
#         elseif ramp_id != 0
#             reqb["ramp_id"] = ramp_id
#         # else
#         #     println("No step_id or ramp_id will be specified.")
#         end
#     elseif action == "meltcurve"
#         reqb["experiment_id"] = exp_id
#         reqb["stage_id"] = stage_id
#     elseif action == "analyze"
#         reqb["experiment_info"] = OrderedDict(
#             "id"   => exp_id,
#             "guid" => guid
#         )
#     else
#         error(logger, "unrecognized action")
#     end
#
#     for key in keys(extra_args)
#         reqb[key] = extra_args[key]
#     end
#
#     if wdb == "handle"
#         reqb["db_key"] = db_key
#     elseif wdb == "dflt"
#         nothing
#     elseif wdb == "connect"
#         reqb["db_host"] = db_host
#         reqb["db_usr"]  = db_usr
#         reqb["db_pswd"] = db_pswd
#         reqb["db_name"] = db_name
#     else
#         error(logger, "`wdb` must be one of the following: \"handle\", \"dflt\", \"connect\"")
#     end
#
#     return json(reqb)
# end ## args2reqb
#
#
## test: it works
# function test0()
#     println(guids)
# end
