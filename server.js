const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MONGODB_URI, PORT } = require('./uils/config');

const app = express();

app.use(express.json());

app.use(cors());

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connecting to MongoDB...');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

const mentorSchema = new mongoose.Schema({
  mentor_id: Number,
  mentor_name: String,
  course: String,
  mentees: Array
}, { versionKey: false });

const studentSchema = new mongoose.Schema({
  student_id: Number,
  student_name: String,
  mentor_id: Number,
  course: String,
}, { versionKey: false }); 

const studentsAll = mongoose.model('studentsAll', studentSchema, 'student'); 
const mentors = mongoose.model('mentors', mentorSchema, 'mentors');

app.get('/', (req, res) => {
  res.send(`   <h1 style="color: #333; text-align: center;">All End Points Display:</h1>

  <div style="margin: 20px;">
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Endpoint</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Description</th>
          </tr>
          <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">/student</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Student Information</td>
          </tr>
          <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">/mentors</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Mentors Information</td>
          </tr>
          <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">/create/student</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Endpoint to create a new student</td>
          </tr>
          <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">/create/mentor</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Endpoint to create a new mentor</td>
          </tr>
          <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">/assignmentor/:mentorId/:studentId</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Endpoint to assign a student to a mentor</td>
          </tr>
          <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">/nomentor</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Endpoint to get students without a mentor</td>
          </tr>
          <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">/assign-mentor/:studentId/:mentorId</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Endpoint to assign or change mentor for a particular student</td>
          </tr>
          <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">/particularmentor/:mentorId</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Endpoint to show all students for a particular mentor</td>
          </tr>
          <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">/previous-mentor/:studentId</td>
              <td style="border: 1px solid #ddd; padding: 8px;">Endpoint to show the previously assigned mentor for a particular student</td>
          </tr>
      </table>
  </div>`)
})

app.get('/student', (req, res) => {
  studentsAll.find({}, {})
    .then(students => {
      res.json(students);
    })
    .catch(error => {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.get('/mentors', (req, res) => {
  mentors.find({}, {})
    .then(mentor => {
      res.json(mentor);
    })
    .catch(error => {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    });
});

// Endpoint to create a new student
app.post('/create/student', (request, response) => {
  const student = new studentsAll(request.body);
  student.save()
    .then(() => {
      response.status(201).json({ message: 'Student created successfully' });
    })
    .catch(error => {
      console.error('Error creating student:', error);
      response.status(500).json({ error: 'Internal Server Error' });
    });
});

// Endpoint to create a new mentor
app.post('/create/mentor', (request, response) => {
  const mentor = new mentors(request.body);
  mentor.save()
    .then(() => {
      response.status(201).json({ message: 'Mentor created successfully' });
    })
    .catch(error => {
      console.error('Error creating mentor:', error);
      response.status(500).json({ error: 'Internal Server Error' });
    });
});
// Endpoint to assign a student to a mentor
app.post('/assignmentor/:mentorId/:studentId', async (req, res) => {
  try {
    const mentorId = req.params.mentorId;
    const studentId = req.params.studentId;

    // Check if the mentor and student exist
    const mentor = await mentors.findOne({ mentor_id: mentorId });
    const student = await studentsAll.findOne({ student_id: studentId });

    if (!mentor || !student) {
      return res.status(404).json({ error: 'Mentor or student not found' });
    }

    // Check if the student already has a mentor
    if (student.mentor_id) {
      return res.status(400).json({ error: 'Student already has a mentor' });
    }

    // Assign the mentor to the student
    student.mentor_id = mentorId;
    await student.save();

    // Add the student to the mentor's mentees list
    mentor.mentees.push({ student_id: studentId });
    await mentor.save();

    res.status(200).json({ message: 'Student assigned to mentor successfully' });
  } catch (error) {
    console.error('Error assigning mentor to student:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to get students without a mentor
app.get('/nomentor', async (req, res) => {
  try {
    const studentsWithoutMentor = await studentsAll.find({ mentor_id: null });
    res.json(studentsWithoutMentor);
  } catch (error) {
    console.error('Error fetching students without mentor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
// Endpoint to assign or change mentor for a particular student
app.post('/assign-mentor/:studentId/:mentorId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const newMentorId = req.params.mentorId;

    // Check if the student exists
    const student = await studentsAll.findOne({ student_id: studentId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if the new mentor exists
    const newMentor = await mentors.findOne({ mentor_id: newMentorId });

    if (!newMentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Change the mentor for the student
    student.mentor_id = newMentorId;
    await student.save();

    res.status(200).json({ message: 'Mentor assigned or changed successfully' });
  } catch (error) {
    console.error('Error assigning or changing mentor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to show all students for a particular mentor
app.get('/paticularmentor/:mentorId', async (req, res) => {
  try {
    const mentorId = req.params.mentorId;

    // Check if the mentor exists
    const mentor = await mentors.findOne({ mentor_id: mentorId });

    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // Get all students for the mentor
    const studentsForMentor = await studentsAll.find({ mentor_id: mentorId });
    res.json(studentsForMentor);
  } catch (error) {
    console.error('Error fetching students for mentor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to show the previously assigned mentor for a particular student
app.get('/previous-mentor/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

    // Check if the student exists
    const student = await studentsAll.findOne({ student_id: studentId });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get the previously assigned mentor
    const previousMentorId = student.mentor_id;
    const previousMentor = await mentors.findOne({ mentor_id: previousMentorId });

    res.json(previousMentor);
  } catch (error) {
    console.error('Error fetching previous mentor:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});