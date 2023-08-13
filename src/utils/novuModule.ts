import { db } from "./prismaClient"
import { novu } from "./general";
import { TriggerRecipientsTypeEnum } from "@novu/node";

export const novuTopicKey = 'notify-users-40566'

export async function createSubscriber(subscriberID: string, email: string) {
    await novu.subscribers.identify(subscriberID, {
      email
    });
}

export const emailSubscriber = "94u5-04359u3-09erwgfoinrgp"
export const mySubscriber = "94u5-04359u3-09erwgfoinrg9"

// createSubscriber(emailSubscriber, "info@monlautos.com")
// createSubscriber(mySubscriber, "chukwuemeka140@gmail.com")

async function subscribeExistingUsers() {
    const users = await db.user.findMany({ where : { email: { contains: 'monlautos'}}})
    users.forEach(async (user) => {
        user.subscriberID && createSubscriber(user.subscriberID, user.email)
        console.log(`Subscribed ${user.email} with subscriberID ${user.subscriberID}`)
    })
}
// subscribeExistingUsers()

async function createTopic() {
    const result = await novu.topics.create({
        key: novuTopicKey,
        name: 'Notify users of job deadline',
    });

    if (result) console.log(result.status)
}

// createTopic()

export async function addSubscriberToTopic(subscribers: string[]) {
    const response = await novu.topics.addSubscribers(novuTopicKey, {
        subscribers: [...subscribers],
    });

    if (response) console.log(response.status)
}

async function subscribeExistingUsersToTopic() {
    const users = await db.user.findMany({ where : { email: { contains: 'monlautos'}}})
    const subs = []
    for (const user of users) {
        if (user.subscriberID) subs.push(user.subscriberID)
    }

    await addSubscriberToTopic(subs)
}

// subscribeExistingUsersToTopic()

export async function triggerNotification() {
    const now = new Date();
    const twentyFourHoursFromNow = new Date();
    twentyFourHoursFromNow.setHours(now.getHours() + 24);

    const jobsReachingDeadline = await db.job.findMany({
        where: {
            AND: {
                deliveryDate: {
                    gte: now,
                    lt: twentyFourHoursFromNow,
                },
                NOT: {
                    status: 'COMPLETED'
                }

            }
        },
        select: {
            id: true,
            customer: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },
            jobType: {
                select: {
                    name: true
                }
            }
        }
    })

    for (const job of jobsReachingDeadline) {
        await novu.trigger('monl', {
            to: [{type: TriggerRecipientsTypeEnum.TOPIC, topicKey: novuTopicKey}],
            payload: {
                job: {
                    jobType: job.jobType.name,
                    customerName: job.customer.firstName + ' ' + job.customer.lastName,
                    id: job.id
                  }
            }
        })
        await novu.trigger('monl-email', {
            to: [{subscriberId: emailSubscriber}],
            payload:{
                job: {
                    jobType: job.jobType.name,
                    customerName: job.customer.firstName + ' ' + job.customer.lastName,
                    id: job.id
                }
            }
        })
    }
    // console.log(jobsReachingDeadline)
}
// triggerNotification()

async function test () {
    await novu.trigger('monl-email', {
        to: [{subscriberId: emailSubscriber}, {subscriberId: mySubscriber}],
        payload:{
            job: {
                jobType: "General Maintenance",
                customerName: "Test User",
                id: 22
            }
        }
    })
    console.log("run")
}
// test()
