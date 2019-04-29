const db = require("../core/db");
const formulas = require("../helpers/formulas");
module.exports = {
	/* 
	getOrderOperationString
	Requires that react-table column ids match db column names and db json object keys.
	For example, if you want to sort by reach (which is inside of the insights column of Campaign),
	your react-table column id for reach needs to be "insights.reach"
	*/

	getOrderOperationString: (filters) => {
		let stringBasedKeys = [
			"name", "information/status", "information/effective_status"
		]
		var orderString = "";
		if (filters.sort && filters.sort.length > 0) {
			// assumes support of one-column sort only
			if (filters.sort[0].id && filters.sort[0].desc != null) {
				let sortOrder = (filters.sort[0].desc) ? "DESC" : "ASC";

				// Checks if we're looking for JSON
				if (filters.sort[0].id.includes("/")) {
					// Get name of column and list of keys
					var keyList = filters.sort[0].id.split("/");
					let jsonColName = keyList.shift();
					
					// get timerange from filters obj
					var timeRange = "lifetime";
					if (filters.timeframe) {
						timeRange = filters.timeframe
					}

					// reset timeline if not pulling from insights
					if (!filters.sort[0].id.includes("insights")) {
						timeRange = ""
					}
					
					// generate path to field
					var targetString = jsonColName + "#>>'{" + ((timeRange != "") ? (timeRange + ",") : "") + keyList.join(',') + "}'";

					// cast to number if needed
					if (!stringBasedKeys.includes(filters.sort[0].id)) {
						targetString = "CAST(" + targetString + " AS decimal)"
					}
					
					// specify in what order you'd like the data
					orderString = targetString + " " + sortOrder + " NULLS LAST";
				} else {
					orderString = filters.sort[0].id + " " + sortOrder + " NULLS LAST";
				}
			}
		}
		//console.log(orderString)
		if (orderString == "") {
			orderString = "information#>>'{effective_status}' ASC"
		}
		return orderString;
	},
	getWhereOperator: async (accountID, filters, sourcePage) => {
		const Op = db.Sequelize.Op;
		var whereParams = {};
		whereParams.accountID = accountID;
		// Search
		if (filters.searchTerm && filters.searchTerm != "") {
			whereParams.name = {[Op.iLike]: '%'+filters.searchTerm+'%'};
		}
		// Selected Campaigns
		if (filters.inCampaigns) {
			if (filters.inCampaigns.length > 0) {
				whereParams.campaignID = {[Op.in]: filters.inCampaigns}
			}
		}
		// Selected Adsets
		if (filters.inAdsets) {
			if (filters.inAdsets.length > 0) {
				whereParams.adsetID = {[Op.in]: filters.inAdsets}
			}
		}
		// Filters
		if (filters.filters) {
			if ("hadDelivery" in filters.filters) {
				console.log("hadDelivery!")
				var timeRange = "lifetime";
				if (filters.timeframe) {
					timeRange = filters.timeframe
				}
				whereParams.active = db.Sequelize.literal(`CAST(insights#>>'{${timeRange},impressions}' as decimal) > 0`);
			}
			if ("bySelection" in filters.filters) {
				if (sourcePage == "campaigns") {
					if (filters.selCampaigns) {
						if (filters.selCampaigns.length > 0) {
							whereParams[Op.and]= {id: filters.selCampaigns}
						}
					}
				}
				if (sourcePage == "adsets") {
					if (filters.selAdsets) {
						if (filters.selAdsets.length > 0) {
							whereParams[Op.and] = [{id: filters.selAdsets}]
						}
					}
				}
				if (sourcePage == "ads") {
					if (filters.selAds) {
						if (filters.selAds.length > 0) {
							whereParams[Op.and] = [{id: filters.selAds}]
						}
					}
				}
			}
			if ("active" in filters.filters) {
				console.log("active active!")
				whereParams.active = db.Sequelize.literal("information#>>'{effective_status}' LIKE 'ACTIVE'");
			}
			
			if ("rules" in filters.filters) {
				let rules = await db.Rules.Rules.findAll();
				let ruleIdMap = rules.map((item) => {
					return item.linkID.id
				})
				if (whereParams[Op.or]) {
					whereParams[Op.or].push({id: ruleIdMap})
				} else {
					whereParams[Op.or]= [{id: ruleIdMap}]
				}
			}
			if ("scheduledActions" in filters.filters) {
				let actions = await db.Rules.ScheduledRules.findAll();
				let actionsIdMap = actions.map((item) => {
					return item.linkID.id
				})
				if (whereParams[Op.or]) {
					whereParams[Op.or].push({id: actionsIdMap})
				} else {
					whereParams[Op.or]= [{id: actionsIdMap}]
				}
			}
		}
	

		// Ignores Archieved and Deleted Content
		whereParams.information = {
			status: {
				[Op.in]: ["ACTIVE", "PAUSED"]
			}
		}
		//console.log("where params \n" + JSON.stringify(whereParams))

		return whereParams;
	},
	getColumnsSumQuery: (accountID, tableName, columnName, filters, funcName) => {
		let column = ""
		let andWhere = ""
		//console.log("running column query generator")
		if (columnName.includes("/")) {
			var keyList = columnName.split("/");
			let jsonColName = keyList.shift();

			var timeRange = "lifetime";
			if (filters.timeframe) {
				timeRange = filters.timeframe
			}
			// dailybudget isn't categorized by time range. Override time range
			if(columnName.includes("daily_budget")) {
				timeRange = ""
			}

			column = `${jsonColName}#>>'{` + ((timeRange != "") ? (timeRange + ",") : "") + `${keyList.join(",")}}'`
		} else {
			column = columnName
		}
		if (filters.searchTerm) {
			andWhere = `AND "${tableName}"."name" ILIKE '%${filters.searchTerm}%'`
		}

		// Filters
		/*
		if (filters.filters) {
			if ("hadDelivery" in filters.filters) {
				var timeRange = "lifetime";
				if (filters.timeframe) {
					timeRange = filters.timeframe
				}
				andWhere += ` CAST(insights#>>'{${timeRange},impressions}' as decimal) > 0`;
			}
			if ("bySelection" in filters.filters) {
				if (tableName == "ad_campaigns") {
					if (filters.selCampaigns) {
						if (filters.selCampaigns.length > 0) {
							let selCampaignStrings = filters.selCampaigns.map(item => {
								return `'${item}'`
							})
							andWhere += ` AND id in (${selCampaignStrings.join(",")})`
							console.log("andWhere: " + andWhere)
						}
					}
				}
				if (tableName == "ad_adets") {
					if (filters.selAdsets) {
						if (filters.selAdsets.length > 0) {
							whereParams[Op.and] = [{id: filters.selAdsets}]
						}
					}
				}
				if (tableName == "ad_ads") {
					if (filters.selAds) {
						if (filters.selAds.length > 0) {
							whereParams[Op.and] = [{id: filters.selAds}]
						}
					}
				}
			}
			if ("active" in filters.filters) {
				console.log("active active!")
				whereParams.active = db.Sequelize.literal("information#>>'{status}' LIKE 'ACTIVE'");
			}
			if ("rules" in filters.filters) {
				let rules = await db.Rules.Rules.findAll();
				let ruleIdMap = rules.map((item) => {
					return item.linkID.id
				})
				if (whereParams[Op.and]) {
					whereParams[Op.and].push({id: ruleIdMap})
				} else {
					whereParams[Op.and]= [{ id: ruleIdMap }]
				}
			}
			if ("scheduledActions" in filters.filters) {
				let actions = await db.Rules.ScheduledRules.findAll();
				let actionsIdMap = actions.map((item) => {
					return item.linkID.id
				})
				if (whereParams[Op.and]) {
					whereParams[Op.and].push({id: actionsIdMap})
				} else {
					whereParams[Op.and]= [{ id: actionsIdMap }]
				}
			}
		}
		*/
		let completeQuery = `SELECT ${funcName}((${column})::decimal) AS "${funcName}" FROM "${tableName}" AS "${tableName}" WHERE "${tableName}"."accountID" = '${accountID}'${andWhere} LIMIT 1`;
		
		return completeQuery;
	},
	getColumnFooterSums: (items) => {

		let fnType = { NONE: 0, SUM: 1, AVG: 2 }
		let baseValues = [  "insights/spend", 
							"insights/clicks", 
							"insights/impressions", 
							"insights/action_values/offsite_conversion.fb_pixel_purchase",
							"insights/actions/offsite_conversion.fb_pixel_add_to_cart",
							"insights/reach"]

		let baseCalculators = {}
		for (let i = 0; i < baseValues.length; i++) {
			baseCalculators[baseValues[i]] = items
		}
		let footerSums = {...baseCalculators}
	},
	getBaseFooterTotalQueries: (timeRange) => {
		return [
			[db.Sequelize.literal(`sum((insights#>>'{${timeRange},spend}')::decimal)`), 'insights/spend'],
			[db.Sequelize.literal(`sum((insights#>>'{${timeRange},clicks}')::decimal)`), 'insights/clicks'],
			[db.Sequelize.literal(`sum((insights#>>'{${timeRange},impressions}')::decimal)`), 'insights/impressions'],
			[db.Sequelize.literal(`sum((insights#>>'{${timeRange},action_values,offsite_conversion.fb_pixel_purchase}')::decimal)`), 'insights/action_values/offsite_conversion.fb_pixel_purchase'],
			[db.Sequelize.literal(`sum((insights#>>'{${timeRange},actions,offsite_conversion.fb_pixel_purchase}')::decimal)`), 'insights/actions/offsite_conversion.fb_pixel_purchase'],
			[db.Sequelize.literal(`sum((insights#>>'{${timeRange},actions,offsite_conversion.fb_pixel_add_to_cart}')::decimal)`), 'insights/actions/offsite_conversion.fb_pixel_add_to_cart'],
			[db.Sequelize.literal(`sum((insights#>>'{${timeRange},reach}')::decimal)`), 'insights/reach'],
			[db.Sequelize.literal(`sum((information#>>'{daily_budget}')::decimal)`), 'information/daily_budget'],
		]
	},
	getRemainingFooterTotals: (footerObj) => {
		footerObj['insights/website_purchase_roas/offsite_conversion.fb_pixel_purchase'] = formulas.getROAS(footerObj["insights/action_values/offsite_conversion.fb_pixel_purchase"], footerObj["insights/spend"])
		footerObj['insights/ctr'] = formulas.getCTR(footerObj["insights/clicks"], footerObj["insights/impressions"])
		footerObj['insights/cpc'] = formulas.getCPC(footerObj["insights/spend"], footerObj["insights/clicks"])
		footerObj['insights/cpa'] = formulas.getCPA(footerObj["insights/spend"], footerObj["insights/action_values/offsite_conversion.fb_pixel_purchase"])
		footerObj['insights/cpm'] = formulas.getCPM(footerObj["insights/spend"], footerObj["insights/impressions"])
		footerObj['insights/frequency'] = formulas.getFrequency(footerObj["insights/impressions"], footerObj["insights/reach"])
		footerObj['insights/action_values/cost_per_add_to_cart'] = formulas.getCPWAC(footerObj["insights/spend"], footerObj["insights/actions/offsite_conversion.fb_pixel_add_to_cart"])
		footerObj['insights/action_values/cost_per_website_purchase'] = formulas.getCPWP(footerObj["insights/spend"], footerObj["insights/actions/offsite_conversion.fb_pixel_purchase"])
		footerObj['insights/average_order_value'] = formulas.getAOV(footerObj['insights/action_values/offsite_conversion.fb_pixel_purchase'], footerObj['insights/actions/offsite_conversion.fb_pixel_purchase'])
		return footerObj
	}
}