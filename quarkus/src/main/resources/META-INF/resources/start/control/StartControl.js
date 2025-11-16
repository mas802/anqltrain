const buildTrainUrl = (path, label, token) => {
    const params = new URLSearchParams();
    if (label) {
        params.set('key', label);
    }
    if (token) {
        params.set('token', token);
    }
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
}

export const trainToggle = async (label, token) => {
    let response, result;

    console.log(Date.now() + ' train toggle call start');
    try {
        response = await fetch(buildTrainUrl('/train/', label, token), {
            method: 'GET'
        });
        result = await response.json();
    } catch (error) {
        console.log(error, 'Train server is not available');
        return {"state":"error", "until":"-1"};
        return;
    } finally {
      console.log(Date.now() + ' train toggle call end');
    }

    console.log(result);
    return result;
}

export const trainInfo = async (label, token) => {
    let response, result;

    console.log(Date.now() + ' train info call start');
    try {
        response = await fetch(buildTrainUrl('/train/info', label, token), {
            method: 'GET'
        });
        result = await response.json();
    } catch (error) {
        console.log(error, 'Train server is not available');
        return {"state":"error", "until":"-1"};
        return;
    } finally {
      console.log(Date.now() + ' train info call end');
    }

    console.log(result);
    return result;
}
