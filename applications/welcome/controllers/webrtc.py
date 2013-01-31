# coding: utf8
# try something like
host_name = request.env['http_host']
host_name = host_name[:host_name.find(':')]
def teacher():
    import sha, random, base64
    key_gen = base64.b64encode(sha.sha(str(random.random())).hexdigest())[:8]
    db.rtc.insert(access_token = key_gen)
    return dict(host = host_name,access_token = key_gen,class_name=request.args[0])
def student():
    import sha, random, base64
    key_gen = base64.b64encode(sha.sha(str(random.random())).hexdigest())[:8]
    id = db.rtc.insert(access_token = key_gen)
    #relate_keys_db = db(db.rtc.id < id).select(db.rtc.access_token,limitby=(0, 2),orderby=~db.rtc.id)
    #relate_keys = [str(item.access_token) for item in relate_keys_db]
    relate_keys_db = db(db.rtc.id < id).select(db.rtc.access_token).first()
    relate_keys =[relate_keys_db.access_token,]
    return dict(host = host_name,access_token = key_gen,class_name=request.args[0],relate_keys= XML(relate_keys))
def connect():
   from gluon.contrib.websocket_messaging import websocket_send
   websocket_send('http://'+host_name+':8888',request.vars.msg,'rtc',request.args[0])
def demo():
    response.files.append(URL('static','js/adapter.js')) 
    return dict()
