/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;

	DB: D1Database;
}

export default {
	
	async fetch(request: Request, env: Env){

		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
			"Access-Control-Allow-Headers": "*",
			"Access-Control-Max-Age": "86400",
		  };

		  if (request.method === "OPTIONS") {
			return new Response( null, {
				status: 200,
				headers: {
					...corsHeaders,
				},

		  }) 
		}   else if (request.method === "POST") {
			let test = JSON.stringify(await request.json());

			const jsonObject = JSON.parse(test);
			const fromDate = jsonObject.fromDate;
            const toDate = jsonObject.toDate;
			//const { fromDate, toDate } =  test;
			console.log("ok body")
			console.log(test);
			console.log(fromDate);
			console.log(toDate);
			const stmt = env.DB.prepare('SELECT COUNT(*) AS NUM, ClientIP FROM http_requests_client WHERE EdgeStartTimestamp BETWEEN ?1 AND ?2 GROUP BY ClientIP ORDER BY NUM DESC;').bind(fromDate, toDate);
			const stmt2 = env.DB.prepare('SELECT EdgeStartTimestamp, EdgeResponseStatus, COUNT(*) AS NUM FROM http_requests_edge WHERE EdgeResponseStatus IS NOT NULL AND EdgeStartTimestamp BETWEEN ?1 AND ?2  GROUP BY EdgeStartTimestamp, EdgeResponseStatus ORDER BY EdgeStartTimestamp ASC;').bind(fromDate, toDate);
			const stmt3 = env.DB.prepare('SELECT ORIGIN.EdgeStartTimestamp AS EdgeStartTimestamp1, ORIGIN.OriginIP As OriginIP, (strftime(\'%s\', EDGE.EdgeEndTimestamp) - strftime(\'%s“\', EDGE.EdgeStartTimestamp)) AS DurationInSeconds  FROM http_requests_origin AS ORIGIN JOIN http_requests_edge AS EDGE ON  ORIGIN.EdgeStartTimestamp = EDGE.EdgeStartTimestamp WHERE EdgeStartTimestamp1 BETWEEN ?1 AND ?2 AND DurationInSeconds > 0 AND OriginIP != \'\' GROUP BY EdgeStartTimestamp1, OriginIP ORDER BY EdgeStartTimestamp1 ASC;').bind(fromDate, toDate);

			//const stmt3 = env.DB.prepare('SELECT ORIGIN.EdgeStartTimestamp AS EdgeStartTimestamp, ORIGIN.OriginIP As EdgeResponseStatus, (strftime(\'%s\', EDGE.EdgeEndTimestamp) - strftime(\'%s“\', EDGE.EdgeStartTimestamp)) AS NUM FROM http_requests_origin AS ORIGIN JOIN http_requests_edge AS EDGE ON  ORIGIN.EdgeStartTimestamp = EDGE.EdgeStartTimestamp WHERE ORIGIN.EdgeStartTimestamp BETWEEN ?1 AND ?2 AND DurationInSeconds > 0 GROUP BY EdgeTime, originIP ORDER BY ORIGIN.EdgeStartTimestamp ASC;').bind(fromDate, toDate);
			//console.log(`stmt: ${JSON.stringify(stmt)}`);
			//console.log(`stmt: ${JSON.stringify(stmt2)}`);
			console.log(`stmt: ${JSON.stringify(stmt3)}`);
			const rows = await env.DB.batch([
				stmt,
				stmt2,
				stmt3
			]);

			//const { results } = await stmt.all();
			//console.log(`row0: ${JSON.stringify(rows[0].results)}`)
			//console.log(`row1: ${JSON.stringify(rows[1].results)}`)
			console.log(`row3: ${JSON.stringify(rows[2].results)}`)
			//console.log(`row: ${JSON.stringify(rows)}`)

			const newResult = rows.map(item => {
				return item.results;
				})


			console.log(`new: ${JSON.stringify(newResult)}`);
			
			return new Response(JSON.stringify(newResult), {
			headers: {
				"content-type": "application/json;charset=UTF-8",
				...corsHeaders,
			},
		});
		  } else if (request.method === "GET") {
			return new Response("The request was a GET");
		  }

	},
};

