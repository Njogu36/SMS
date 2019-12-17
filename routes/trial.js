if (req.user.usernameSMS === undefined && req.user.apikeySMS === undefined) {
    req.flash('danger', 'Kindly add your africanstalking credentials')
    res.redirect('/recurrence')
}
else {
    if (req.body.typeSMS4 === 'option1') {
        if (req.body.phone !== '') {
            Monthly.findOne({ typeMessage: 'Individual', phone: req.body.phone, message: req.body.message }, function (err, monthly) {
                if (err) {
                    res.redirect('/error')
                }
                if (monthly) {
                    req.flash('danger', 'Monthly reminder already exists.')
                    res.redirect('/recurrence')
                }
                else {
                    var data = new Monthly();
                    data.phone = req.body.phone;
                    data.typeMessage = 'Individual';
                    data.createdOn = new Date();
                    data.every = req.body.every
                    data.scheduleddate = req.body.start + '/' + req.body.time;

                    if (req.body.date === '') {
                        data.finaldate = '';
                    }
                    if (req.body.date !== '') {
                        data.finaldate = req.body.date + '/' + req.body.time;
                    }
                    data.message = req.body.message;
                    data.time = req.body.time
                    data.userID = req.user.id;
                    data.account = true
                    data.senderidSMS = req.user.senderidSMS;
                    data.usernameSMS = req.user.usernameSMS;
                    data.apikeySMS = req.user.apikeySMS;

                    data.status = 'Pending'
                    data.save(function (err) {
                        if (err) {
                            res.redirect('/error')
                        }
                        if (req.body.date === '') {
                            req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone)
                            res.redirect('/recurrence')
                        }
                        if (req.body.date !== '') {
                            req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to ' + req.body.phone + ' and it will end on ' + req.body.date)
                            res.redirect('/recurrence')
                        }

                    })
                }
            })
        }
        else {
            req.flash('danger', 'Phone number is required.')
            res.redirect('/recurrence')
        }

    }
    if (req.body.typeSMS4 === 'option2') {
        Monthly.findOne({ typeMessage: 'Bulk', message: req.body.message }, function (err, monthly) {
            if (err) {
                res.redirect('/error')
            }
            if (monthly) {
                req.flash('danger', 'Monthly reminder already exists')
                res.redirect('/recurrence')
            }
            else {
                var data = new Monthly();
                data.typeMessage = 'Bulk';
                data.createdOn = new Date();
                data.every = req.body.every
                data.scheduleddate = req.body.start + '/' + req.body.time;

                if (req.body.date === '') {
                    data.finaldate = '';
                }
                if (req.body.date !== '') {
                    data.finaldate = req.body.date + '/' + req.body.time;
                }
                data.message = req.body.message;
                data.userID = req.user.id;
                data.time = req.body.time;
                data.account = true
                data.senderidSMS = req.user.senderidSMS;
                data.usernameSMS = req.user.usernameSMS;
                data.apikeySMS = req.user.apikeySMS;
                data.status = 'Pending'
                data.save(function (err) {
                    if (err) {
                        res.redirect('/error')
                    }
                    if (req.body.date === '') {
                        req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and  it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all your customers.')
                        res.redirect('/recurrence')
                    }
                    if (req.body.date !== '') {
                        req.flash('info', 'Monthly reminder added successfully. Its start date will be on ' + req.body.start + ' and it will be sent after every ' + req.body.every + ' month(s) at ' + req.body.time + ' to all your customers and it will end on ' + req.body.date)
                        res.redirect('/recurrence')
                    }

                })
            }
        })
    }
}