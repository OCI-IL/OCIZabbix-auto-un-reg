const fdk=require('@fnproject/fdk');
const axios = require('axios');

fdk.handle(function(input){
    return onEvent(input);
})





 

async function zabbixAPIRequest(payload) {

  // Zabbix API endpoint
  const zabbixHostIpName = 'x.x.x.x';
  // Zabbix API credentials
  const zabbixUser = 'Admin';
  const zabbixPassword = 'my_pass_word';
  // Add authentication details to the payload
  payload.auth = null;

  const zabbixUrl =`'http://${zabbixHostIpName}/zabbix/api_jsonrpc.php`;

  const authResponse = await axios.post(zabbixUrl, {
    jsonrpc: '2.0',
    method: 'user.login',
    params: {
      user: zabbixUser,
      password: zabbixPassword,
    },
    id: 1,
  });
  if (authResponse) {
    payload.auth = authResponse.data.result;
    return axios.post(zabbixUrl, payload);
  }
 return null;
}

 

// Oracle Cloud Function handler

const onEvent = async (event) => {
  console.log("async event:"+JSON.stringify(event));
  // Check if the event is the expected trigger event

  if (event.eventType === 'com.oraclecloud.computeapi.terminateinstance.begin') {

    // Extract VM hostname from the event payload

    const vmHostname = event.data.resourceName;

    // Zabbix API request payload for finding the host by hostname

    const getHostPayload = {

      jsonrpc: '2.0',

      method: 'host.get',

      params: {

        filter: {

          host: [vmHostname],

        },

      },

      id: 2,

    };

 
    // Zabbix API request payload for deleting a host
    const deleteHostPayload = {

      jsonrpc: '2.0',

      method: 'host.delete',

      params: [],

      id: 3,

    };

 
    const response = await zabbixAPIRequest(getHostPayload);

    if(response) {
        const hostId = response.data.result[0].hostid;
        console.log(`hostId:${hostId}`);
        deleteHostPayload.params.push(hostId);
        const delRes = await zabbixAPIRequest(deleteHostPayload);
        console.log('VM monitor removed successfully:', delRes.data);
        return 'VM monitor removed successfully';
    }

  } else {

    console.log('Ignoring non-terminateinstance event');

    return 'Ignoring non-terminateinstance event';

  }

};


